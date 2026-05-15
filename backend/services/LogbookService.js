import models from "../models/index.js";
import { Op } from "sequelize";
import moment from "moment-timezone";
import WorkCalendarService from "./WorkCalendarService.js";

const { Logbook, User, Leave } = models;
const TIMEZONE = "Asia/Jakarta";

class LogbookService {
    /**
     * Ensure logbook records exist for all workdays in a date range.
     * If a record is missing for a past workday, create a 'not_filled' record.
     * Sama persis dengan pola AttendanceService.ensureAttendanceRecords.
     *
     * @param {number} userId - ID of the user
     * @param {Date|string} startDate - Start of range
     * @param {Date|string} endDate - End of range
     */
    async ensureLogbookRecords(userId, startDate, endDate) {
        try {
            const user = await User.findByPk(userId);
            // Hanya backfill jika user sudah di divisi
            if (!user || !user.division_id) return;

            const start = moment(startDate).tz(TIMEZONE).startOf("day");
            const end = moment(endDate).tz(TIMEZONE).startOf("day");
            const today = moment().tz(TIMEZONE).startOf("day");

            // Hanya backfill s/d kemarin — hari ini belum selesai
            const lastDateToCheck = end.isBefore(today)
                ? end
                : today.clone().subtract(1, "day");

            if (lastDateToCheck.isBefore(start)) return;

            // Ambil tanggal yang sudah ada logbook-nya
            const existingLogbooks = await Logbook.findAll({
                where: {
                    user_id: userId,
                    date: {
                        [Op.between]: [
                            start.format("YYYY-MM-DD"),
                            lastDateToCheck.format("YYYY-MM-DD"),
                        ],
                    },
                },
                attributes: ["date"],
                raw: true,
            });

            const existingDates = new Set(
                existingLogbooks.map((l) => moment(l.date).format("YYYY-MM-DD"))
            );

            // Iterasi setiap hari dalam range
            const current = start.clone();
            const notFilledRecords = [];

            while (current.isSameOrBefore(lastDateToCheck)) {
                const dateStr = current.format("YYYY-MM-DD");

                if (!existingDates.has(dateStr)) {
                    // Cek apakah hari kerja
                    const { isWorkday } = await WorkCalendarService.isWorkday(
                        current.toDate()
                    );

                    // Cek apakah setelah user bergabung divisi
                    const isAfterJoin = user.division_assigned_at
                        ? current.isSameOrAfter(
                              moment(user.division_assigned_at)
                                  .tz(TIMEZONE)
                                  .startOf("day")
                          )
                        : current.isSameOrAfter(
                              moment(user.created_at).tz(TIMEZONE).startOf("day")
                          );

                    if (isWorkday && isAfterJoin) {
                        // Cek apakah user sedang cuti yang disetujui
                        const leave = await Leave.findOne({
                            where: {
                                user_id: userId,
                                status: "approved",
                                start_date: { [Op.lte]: dateStr },
                                end_date: { [Op.gte]: dateStr },
                            },
                        });

                        // Jika tidak cuti, buat record not_filled
                        if (!leave) {
                            notFilledRecords.push({
                                user_id: userId,
                                division_id: user.division_id,
                                date: dateStr,
                                time: "23:59:00",
                                activity: "Tidak Mengisi Logbook",
                                description:
                                    "Record otomatis — user tidak mengisi logbook pada hari ini.",
                                status: "not_filled",
                                is_system_generated: true,
                            });
                        }
                    }
                }

                current.add(1, "day");
            }

            if (notFilledRecords.length > 0) {
                // ignoreDuplicates agar tidak error jika sudah ada
                await Logbook.bulkCreate(notFilledRecords, {
                    ignoreDuplicates: true,
                });
                console.log(
                    `[LogbookService] Backfilled ${notFilledRecords.length} not_filled records for user ${userId}`
                );
            }
        } catch (error) {
            // Jangan throw — jangan ganggu request utama
            console.error("[LogbookService.ensureLogbookRecords] Error:", error.message);
        }
    }
}

export default new LogbookService();
