import nodemailer from "nodemailer";
import models from "../models/index.js";
import { getJakartaDate } from "../utils/dateHelper.js";

const { AppSetting, User } = models;

class NotificationService {
    constructor() {
        this.transporter = null;
        this.isReady = false;
        this.init();
    }

    async init() {
        try {
            // Check if notification is enabled in database
            const setting = await AppSetting.findOne({
                where: { key: "notification_enabled" },
                raw: true,
            });

            const isEnabled = setting && (setting.value === "true" || setting.value === true);

            if (!isEnabled) {
                console.log("[NotificationService] Notifications are disabled in AppSetting.");
                return;
            }

            // Check env vars
            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
                console.warn("[NotificationService] EMAIL_USER or EMAIL_PASS not set in .env");
                return;
            }

            // Configure Nodemailer for Gmail/SMTP
            // Gmail is the most common use-case for this
            this.transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST || "smtp.gmail.com",
                port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 465,
                secure: process.env.EMAIL_PORT === "465" || !process.env.EMAIL_PORT, // true for 465, false for other ports
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            // Verify connection
            await this.transporter.verify();
            this.isReady = true;
            console.log("[NotificationService] Email transporter ready.");
        } catch (error) {
            console.error("[NotificationService] Initialization error:", error.message);
        }
    }

    /**
     * Send email notification (non-blocking)
     */
    async sendEmail(to, subject, htmlContent) {
        if (!this.isReady || !this.transporter) {
            console.log(`[NotificationService] Skipped email to ${to} (Service not ready or disabled)`);
            return false;
        }

        try {
            const mailOptions = {
                from: `"Sistem Presensi" <${process.env.EMAIL_USER}>`,
                to,
                subject,
                html: htmlContent,
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log(`[NotificationService] Email sent to ${to}: ${info.messageId}`);
            return true;
        } catch (error) {
            console.error(`[NotificationService] Error sending email to ${to}:`, error.message);
            return false;
        }
    }

    /**
     * Notify Supervisor about a new leave request
     * 
     * @param {Object} leave - Leave request object
     * @param {Object} user - The user who submitted the request
     * @param {Object} supervisor - The supervisor to notify
     */
    async notifyLeaveSubmitted(leave, user, supervisor) {
        if (!supervisor || !supervisor.email) return;

        const typeLabels = {
            izin_sakit: "Sakit",
            izin_keperluan: "Izin Keperluan Lainnya"
        };
        const leaveType = typeLabels[leave.type] || leave.type;

        const subject = `[Presensi] Pengajuan Izin Baru - ${user.name}`;
        
        const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #4a90e2; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Pengajuan Izin Baru</h2>
            <p>Halo <strong>${supervisor.name}</strong>,</p>
            <p>Terdapat pengajuan izin/cuti baru dari anggota tim Anda yang membutuhkan persetujuan.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; width: 120px; font-weight: bold;">Nama</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${user.name}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-weight: bold;">Tipe</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${leaveType}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-weight: bold;">Tanggal</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${leave.start_date} s/d ${leave.end_date} (${leave.duration} hari)</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-weight: bold;">Alasan</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${leave.reason}</td>
                </tr>
            </table>
            
            <p style="margin-top: 20px;">Silakan login ke sistem untuk meninjau pengajuan ini.</p>
            <br>
            <p style="color: #888; font-size: 12px; margin-top: 30px; border-top: 1px solid #f0f0f0; padding-top: 10px;">
                Email ini dikirim otomatis oleh Sistem Presensi. Mohon tidak membalas email ini.
            </p>
        </div>
        `;

        // Send non-blocking
        this.sendEmail(supervisor.email, subject, html).catch(err => console.error("notifyLeaveSubmitted error", err));
    }

    /**
     * Notify User about leave request result (approved/rejected)
     * 
     * @param {Object} leave - Leave request object
     * @param {Object} user - The user to notify
     * @param {Object} supervisor - The supervisor who processed the request
     * @param {string} status - 'approved' or 'rejected'
     */
    async notifyLeaveProcessed(leave, user, supervisor, status) {
        if (!user || !user.email) return;

        const typeLabels = {
            izin_sakit: "Sakit",
            izin_keperluan: "Izin Keperluan Lainnya"
        };
        const leaveType = typeLabels[leave.type] || leave.type;
        
        const isApproved = status === "approved";
        const statusLabel = isApproved ? "Disetujui" : "Ditolak";
        const statusColor = isApproved ? "#28a745" : "#dc3545";

        const subject = `[Presensi] Pengajuan Izin Anda ${statusLabel}`;
        
        const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: ${statusColor}; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Status Pengajuan Izin: ${statusLabel}</h2>
            <p>Halo <strong>${user.name}</strong>,</p>
            <p>Pengajuan izin Anda telah diperiksa oleh supervisor <strong>${supervisor.name}</strong> dengan detail sebagai berikut:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; width: 120px; font-weight: bold;">Tipe</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${leaveType}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-weight: bold;">Tanggal</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${leave.start_date} s/d ${leave.end_date}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-weight: bold;">Catatan Review</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-style: italic;">
                        ${leave.review_notes || (isApproved ? "Telah disetujui tanpa catatan khusus." : "Tidak ada catatan.")}
                    </td>
                </tr>
            </table>
            
            <p style="margin-top: 20px;">Silakan cek dashboard aplikasi untuk melihat saldo cuti Anda atau informasi lebih lanjut.</p>
            <br>
            <p style="color: #888; font-size: 12px; margin-top: 30px; border-top: 1px solid #f0f0f0; padding-top: 10px;">
                Email ini dikirim otomatis oleh Sistem Presensi. Mohon tidak membalas email ini.
            </p>
        </div>
        `;

        // Send non-blocking
        this.sendEmail(user.email, subject, html).catch(err => console.error("notifyLeaveProcessed error", err));
    }

    /**
     * Notify Supervisor about a new logbook submission
     * 
     * @param {Object} logbook - Logbook object
     * @param {Object} user - The user who submitted the logbook
     * @param {Object} supervisor - The supervisor to notify
     */
    async notifyLogbookSubmitted(logbook, user, supervisor) {
        if (!supervisor || !supervisor.email) return;

        const subject = `[Presensi] Logbook Baru - ${user.name}`;

        const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #4a90e2; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Logbook Baru Menunggu Review</h2>
            <p>Halo <strong>${supervisor.name}</strong>,</p>
            <p>Terdapat logbook baru dari anggota tim Anda yang menunggu ditinjau.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; width: 120px; font-weight: bold;">Nama</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${user.name}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-weight: bold;">Tanggal</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${logbook.date}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-weight: bold;">Aktivitas</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${logbook.activity}</td>
                </tr>
                ${logbook.description ? `<tr>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-weight: bold;">Deskripsi</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${logbook.description}</td>
                </tr>` : ''}
            </table>
            
            <p style="margin-top: 20px;">Silakan login ke sistem untuk meninjau logbook ini.</p>
            <br>
            <p style="color: #888; font-size: 12px; margin-top: 30px; border-top: 1px solid #f0f0f0; padding-top: 10px;">
                Email ini dikirim otomatis oleh Sistem Presensi. Mohon tidak membalas email ini.
            </p>
        </div>
        `;

        this.sendEmail(supervisor.email, subject, html).catch(err => console.error("notifyLogbookSubmitted error", err));
    }

    /**
     * Notify User about their logbook review result
     * 
     * @param {Object} logbook - Logbook object
     * @param {Object} user - The user to notify
     * @param {Object} supervisor - The supervisor who reviewed
     * @param {string} status - 'approved' or 'rejected'
     */
    async notifyLogbookProcessed(logbook, user, supervisor, status) {
        if (!user || !user.email) return;

        const isApproved = status === "approved";
        const statusLabel = isApproved ? "Disetujui" : "Ditolak";
        const statusColor = isApproved ? "#28a745" : "#dc3545";

        const subject = `[Presensi] Logbook Anda ${statusLabel}`;

        const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: ${statusColor}; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Status Logbook: ${statusLabel}</h2>
            <p>Halo <strong>${user.name}</strong>,</p>
            <p>Logbook Anda pada tanggal <strong>${logbook.date}</strong> telah ditinjau oleh supervisor <strong>${supervisor.name}</strong>.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; width: 120px; font-weight: bold;">Tanggal</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${logbook.date}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-weight: bold;">Aktivitas</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${logbook.activity}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-weight: bold;">Status</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; color: ${statusColor}; font-weight: bold;">${statusLabel}</td>
                </tr>
                ${logbook.review_notes ? `<tr>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-weight: bold;">Catatan Supervisor</td>
                    <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-style: italic;">${logbook.review_notes}</td>
                </tr>` : ''}
            </table>
            
            <p style="margin-top: 20px;">Silakan cek aplikasi untuk informasi lebih lanjut${!isApproved ? ' dan perbaiki logbook Anda jika diperlukan' : ''}.</p>
            <br>
            <p style="color: #888; font-size: 12px; margin-top: 30px; border-top: 1px solid #f0f0f0; padding-top: 10px;">
                Email ini dikirim otomatis oleh Sistem Presensi. Mohon tidak membalas email ini.
            </p>
        </div>
        `;

        this.sendEmail(user.email, subject, html).catch(err => console.error("notifyLogbookProcessed error", err));
    }

    /**
     * Send a daily digest email to ALL supervisors summarizing pending logbooks in their division.
     * Should be called by a cron job (e.g. every morning at 08:00 WIB).
     * Each supervisor gets ONE email with a summary table — not one email per logbook.
     */
    async sendLogbookDigest() {
        if (!this.isReady || !this.transporter) {
            console.log("[NotificationService] Digest skipped (service not ready or disabled)");
            return;
        }

        try {
            const { Logbook, User, Division } = models;
            const { Op } = await import("sequelize");

            // 1. Find all active divisions that have at least one supervisor
            const supervisors = await User.findAll({
                where: { role: "supervisor", is_active: true, division_id: { [Op.ne]: null } },
                attributes: ["id", "name", "email", "division_id"],
                raw: true,
            });

            if (supervisors.length === 0) {
                console.log("[DigestEmail] No supervisors found, skipping.");
                return;
            }

            let totalSent = 0;

            for (const supervisor of supervisors) {
                // 2. Get all pending logbooks for users in this division
                const pendingLogbooks = await Logbook.findAll({
                    where: { status: "pending" },
                    include: [{
                        model: User,
                        as: "user",
                        where: { division_id: supervisor.division_id, is_active: true },
                        attributes: ["id", "name"],
                    }],
                    order: [["date", "ASC"]],
                    limit: 50, // Cap at 50 items to keep email readable
                    raw: false,
                });

                if (pendingLogbooks.length === 0) {
                    console.log(`[DigestEmail] No pending logbooks for supervisor ${supervisor.name}`);
                    continue;
                }

                // 3. Group by user for a cleaner display
                const byUser = {};
                for (const lb of pendingLogbooks) {
                    const userName = lb.user?.name || "Unknown";
                    if (!byUser[userName]) byUser[userName] = [];
                    byUser[userName].push({ date: lb.date, activity: lb.activity });
                }

                const totalCount = pendingLogbooks.length;
                const todayStr = new Date().toLocaleDateString("id-ID", {
                    weekday: "long", year: "numeric", month: "long", day: "numeric",
                    timeZone: "Asia/Jakarta"
                });

                // 4. Build HTML rows
                const rows = Object.entries(byUser).map(([name, entries]) => {
                    const entryRows = entries.map(e =>
                        `<tr>
                            <td style="padding:8px 12px; border-bottom:1px solid #f0f0f0; color:#555;">${e.date}</td>
                            <td style="padding:8px 12px; border-bottom:1px solid #f0f0f0;">${e.activity}</td>
                        </tr>`
                    ).join("");
                    return `
                        <tr>
                            <td colspan="2" style="padding:10px 12px; background:#f8f9fa; font-weight:bold; color:#333; border-top: 2px solid #dee2e6;">
                                👤 ${name} <span style="font-weight:normal; color:#888; font-size:12px;">(${entries.length} logbook)</span>
                            </td>
                        </tr>
                        ${entryRows}
                    `;
                }).join("");

                const moreNote = totalCount >= 50
                    ? `<p style="color:#e67e22; font-size:13px;"><strong>⚠️ Hanya menampilkan 50 item pertama.</strong> Silakan buka aplikasi untuk melihat semua data.</p>`
                    : "";

                const subject = `[Presensi] Ringkasan Logbook Pending — ${todayStr}`;
                const html = `
                <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #4a90e2; border-bottom: 2px solid #f0f0f0; padding-bottom: 12px; margin-top: 0;">
                        📋 Ringkasan Logbook Menunggu Review
                    </h2>
                    <p>Halo <strong>${supervisor.name}</strong>,</p>
                    <p>Berikut adalah ringkasan logbook dari divisi Anda yang <strong>belum ditinjau</strong> hingga pagi ini:</p>

                    <div style="background: #e8f4fd; border-left: 4px solid #4a90e2; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
                        <strong style="font-size: 18px; color: #4a90e2;">${totalCount}</strong>
                        <span style="color: #555;"> logbook menunggu review dari <strong>${Object.keys(byUser).length}</strong> anggota tim.</span>
                    </div>

                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <thead>
                            <tr style="background: #4a90e2; color: white;">
                                <th style="padding: 10px 12px; text-align: left; width: 130px;">Tanggal</th>
                                <th style="padding: 10px 12px; text-align: left;">Aktivitas</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>

                    ${moreNote}

                    <div style="margin-top: 24px; text-align: center;">
                        <p style="color: #555;">Silakan login ke sistem untuk meninjau dan memberikan persetujuan.</p>
                    </div>
                    <p style="color: #aaa; font-size: 11px; margin-top: 30px; border-top: 1px solid #f0f0f0; padding-top: 10px;">
                        Email ini dikirim otomatis setiap pagi oleh Sistem Presensi. Mohon tidak membalas email ini.
                    </p>
                </div>
                `;

                const sent = await this.sendEmail(supervisor.email, subject, html);
                if (sent) totalSent++;
            }

            console.log(`[DigestEmail] Logbook digest completed. Emails sent: ${totalSent}/${supervisors.length} supervisors.`);
        } catch (error) {
            console.error("[DigestEmail] Error sending logbook digest:", error.message);
        }
    }
}

// Export as a singleton
const notificationService = new NotificationService();
export default notificationService;
