import models from "../models/index.js";
import { Op } from "sequelize";
import moment from "moment-timezone";
import WorkCalendarService from "./WorkCalendarService.js";

const { Attendance, User, Leave } = models;
const TIMEZONE = "Asia/Jakarta";

class AttendanceService {
    /**
     * Ensure attendance records exist for all workdays in a range
     * If a record is missing for a past workday, create an 'absent' record.
     * 
     * @param {number} userId - ID of the user
     * @param {Date|string} startDate - Start of range
     * @param {Date|string} endDate - End of range
     */
    async ensureAttendanceRecords(userId, startDate, endDate) {
        try {
            const user = await User.findByPk(userId);
            if (!user || !user.division_id) return;

            const start = moment(startDate).tz(TIMEZONE).startOf("day");
            const end = moment(endDate).tz(TIMEZONE).startOf("day");
            const today = moment().tz(TIMEZONE).startOf("day");

            // Only backfill up to yesterday (today is handled by the end-of-day scheduler or live status)
            const lastDateToCheck = end.isBefore(today) ? end : today.clone().subtract(1, "day");
            
            if (lastDateToCheck.isBefore(start)) return;

            // Get existing attendance dates
            const existingAttendances = await Attendance.findAll({
                where: {
                    user_id: userId,
                    date: {
                        [Op.between]: [start.format("YYYY-MM-DD"), lastDateToCheck.format("YYYY-MM-DD")]
                    }
                },
                attributes: ["date"],
                raw: true
            });

            const existingDates = new Set(existingAttendances.map(a => moment(a.date).format("YYYY-MM-DD")));

            // Iterate through each day in range
            const current = start.clone();
            const absentRecords = [];

            while (current.isSameOrBefore(lastDateToCheck)) {
                const dateStr = current.format("YYYY-MM-DD");
                
                // If no record exists for this date
                if (!existingDates.has(dateStr)) {
                    // Check if it's a workday
                    const { isWorkday } = await WorkCalendarService.isWorkday(current.toDate());
                    
                    // Check if it's after user joined division
                    const isAfterJoin = user.division_assigned_at 
                        ? current.isSameOrAfter(moment(user.division_assigned_at).tz(TIMEZONE).startOf("day"))
                        : current.isSameOrAfter(moment(user.created_at).tz(TIMEZONE).startOf("day"));

                    if (isWorkday && isAfterJoin) {
                        // Check if user was on leave
                        const leave = await Leave.findOne({
                            where: {
                                user_id: userId,
                                status: "approved",
                                start_date: { [Op.lte]: dateStr },
                                end_date: { [Op.gte]: dateStr }
                            }
                        });

                        if (!leave) {
                            absentRecords.push({
                                user_id: userId,
                                division_id: user.division_id,
                                date: dateStr,
                                status: "absent",
                                notes: "Tanpa keterangan (Sistem Backfill)",
                                approval_status: "approved"
                            });
                        }
                    }
                }
                current.add(1, "day");
            }

            if (absentRecords.length > 0) {
                await Attendance.bulkCreate(absentRecords);
            }
        } catch (error) {
            // Error handling
        }
    }
}

export default new AttendanceService();
