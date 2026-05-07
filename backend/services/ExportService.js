import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ExportService {
    /**
     * Export attendance data to Excel with improved formatting
     */
    async exportAttendanceToExcel(data, dateRange) {
        const workbook = new ExcelJS.Workbook();

        // Set workbook properties
        workbook.creator = "Admin System";
        workbook.created = new Date();
        workbook.modified = new Date();

        const worksheet = workbook.addWorksheet("Laporan Presensi", {
            pageSetup: {
                paperSize: 9, // A4
                orientation: "landscape",
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 0,
            },
        });

        // Add title and header info
        worksheet.mergeCells("A1:N1");
        const titleCell = worksheet.getCell("A1");
        titleCell.value = "LAPORAN PRESENSI KARYAWAN";
        titleCell.font = { size: 16, bold: true, color: { argb: "FF000000" } };
        titleCell.alignment = { vertical: "middle", horizontal: "center" };
        titleCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE7E6E6" },
        };
        worksheet.getRow(1).height = 30;

        // Add date range info
        worksheet.mergeCells("A2:N2");
        const dateCell = worksheet.getCell("A2");
        dateCell.value = `Periode: ${this.formatDate(
            dateRange.start_date,
        )} - ${this.formatDate(dateRange.end_date)}`;
        dateCell.font = { size: 11, italic: true };
        dateCell.alignment = { vertical: "middle", horizontal: "center" };
        worksheet.getRow(2).height = 20;

        // Add generated date
        worksheet.mergeCells("A3:N3");
        const generatedCell = worksheet.getCell("A3");
        generatedCell.value = `Digenerate pada: ${new Date().toLocaleString(
            "id-ID",
        )}`;
        generatedCell.font = { size: 9, italic: true };
        generatedCell.alignment = { vertical: "middle", horizontal: "center" };
        worksheet.getRow(3).height = 18;

        // Empty row for spacing
        worksheet.addRow([]);

        // Detect work_type mix per record for the label column
        const getWorkTypeLabel = (item) => {
            const checkInType = item.check_in_time ? item.work_type : null;
            // We infer checkout work type from checkout_offsite_reason:
            // if checkout_offsite_reason exists the checkout was offsite, else onsite
            const hasCheckout = !!item.check_out_time;
            if (!checkInType) return "-";
            if (!hasCheckout) return checkInType === "onsite" ? "Onsite" : "Offsite";

            // Detect mixed: checkin onsite but checkout has offsite reason => mixed
            if (checkInType === "onsite" && item.checkout_offsite_reason) return "Onsite → Offsite";
            // Detect mixed: checkin offsite but checkout onsite (no checkout offsite reason)
            if (checkInType === "offsite" && !item.checkout_offsite_reason) return "Offsite → Onsite";
            return checkInType === "onsite" ? "Onsite" : "Offsite";
        };

        // Set column widths and headers (row 5)
        worksheet.columns = [
            { header: "No", key: "no", width: 5 },
            { header: "Tanggal", key: "date", width: 13 },
            { header: "Nama", key: "name", width: 25 },
            { header: "NIP", key: "nip", width: 15 },
            { header: "Divisi", key: "division", width: 20 },
            { header: "Periode", key: "periode", width: 12 },
            { header: "Sumber Magang", key: "sumber_magang", width: 15 },
            { header: "Jam Masuk", key: "check_in", width: 12 },
            { header: "Jam Keluar", key: "check_out", width: 12 },
            { header: "Tipe Kerja", key: "work_type", width: 18 },
            { header: "Status Kehadiran", key: "status", width: 16 },
            { header: "Status Approval", key: "approval_status", width: 16 },
            { header: "Lokasi Check-In", key: "location_in", width: 38 },
            { header: "Lokasi Check-Out", key: "location_out", width: 38 },
            { header: "Keterangan Offsite Check-In", key: "offsite_reason", width: 35 },
            { header: "Keterangan Offsite Check-Out", key: "checkout_offsite_reason", width: 35 },
            { header: "Koordinat Check-In", key: "coord_in", width: 25 },
            { header: "Koordinat Check-Out", key: "coord_out", width: 25 },
            { header: "Foto Check-In", key: "photo_in", width: 14 },
            { header: "Foto Check-Out", key: "photo_out", width: 14 },
            { header: "Catatan", key: "notes", width: 35 },
            { header: "Alasan Penolakan", key: "rejection_reason", width: 35 },
        ];

        // Style header row (row 5)
        const headerRow = worksheet.getRow(5);
        headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
        headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF2E4057" },
        };
        headerRow.alignment = {
            vertical: "middle",
            horizontal: "center",
            wrapText: true,
        };
        headerRow.height = 35;

        // Calculate statistics
        const stats = {
            total: data.length,
            present: data.filter((a) => a.status === "present").length,
            late: data.filter((a) => a.status === "late").length,
            early: data.filter((a) => a.status === "early").length,
            absent: data.filter((a) => a.status === "absent").length,
            onsite: data.filter((a) => a.work_type === "onsite" && !a.checkout_offsite_reason).length,
            offsite: data.filter((a) => a.work_type === "offsite" && !a.checkout_offsite_reason).length,
            mixed_onsite_to_offsite: data.filter((a) => a.work_type === "onsite" && a.checkout_offsite_reason).length,
            mixed_offsite_to_onsite: data.filter((a) => a.work_type === "offsite" && !a.checkout_offsite_reason && a.check_out_time).length,
            approved: data.filter((a) => a.approval_status === "approved").length,
            pending: data.filter((a) => a.approval_status === "pending").length,
            rejected: data.filter((a) => a.approval_status === "rejected").length,
            with_photo: data.filter((a) => a.check_in_photo || a.check_out_photo).length,
        };

        // Add data rows (starting from row 6)
        data.forEach((item, index) => {
            const workTypeLabel = getWorkTypeLabel(item);
            const row = worksheet.addRow({
                no: index + 1,
                date: this.formatDate(item.date),
                name: item.user?.name || "-",
                nip: item.user?.nip || "-",
                division: item.user?.division?.name || "-",
                periode: item.user?.periode || "-",
                sumber_magang: item.user?.sumber_magang || "-",
                check_in: item.check_in_time || "-",
                check_out: item.check_out_time || "Belum Check-Out",
                work_type: workTypeLabel,
                status: this.translateStatus(item.status),
                approval_status: this.translateStatus(item.approval_status),
                location_in: item.check_in_address || "-",
                location_out: item.check_out_address || (item.check_out_time ? "-" : "Belum Check-Out"),
                offsite_reason: item.offsite_reason || "-",
                checkout_offsite_reason: item.checkout_offsite_reason || "-",
                coord_in: (item.check_in_latitude && item.check_in_longitude)
                    ? `${parseFloat(item.check_in_latitude).toFixed(6)}, ${parseFloat(item.check_in_longitude).toFixed(6)}`
                    : "-",
                coord_out: (item.check_out_latitude && item.check_out_longitude)
                    ? `${parseFloat(item.check_out_latitude).toFixed(6)}, ${parseFloat(item.check_out_longitude).toFixed(6)}`
                    : "-",
                photo_in: item.check_in_photo ? "✓ Ada" : "-",
                photo_out: item.check_out_photo ? "✓ Ada" : "-",
                notes: item.notes || "-",
                rejection_reason: item.rejection_reason || "-",
            });

            // Add alternating row colors
            if (index % 2 === 0) {
                row.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFF8F9FA" },
                };
            }

            // Center align specific columns
            ["no","date","check_in","check_out","work_type","status","approval_status","photo_in","photo_out"].forEach(key => {
                row.getCell(key).alignment = { horizontal: "center", vertical: "middle" };
            });

            // Color code status kehadiran
            const statusCell = row.getCell("status");
            statusCell.font = { bold: true };
            if (item.status === "present") {
                statusCell.font = { ...statusCell.font, color: { argb: "FF155724" } };
                statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD4EDDA" } };
            } else if (item.status === "late") {
                statusCell.font = { ...statusCell.font, color: { argb: "FF664D03" } };
                statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF3CD" } };
            } else if (item.status === "early") {
                statusCell.font = { ...statusCell.font, color: { argb: "FF0C5460" } };
                statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1ECF1" } };
            } else if (item.status === "absent") {
                statusCell.font = { ...statusCell.font, color: { argb: "FF721C24" } };
                statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8D7DA" } };
            }

            // Color code approval status
            const approvalCell = row.getCell("approval_status");
            approvalCell.font = { bold: false };
            if (item.approval_status === "approved") {
                approvalCell.font = { color: { argb: "FF155724" } };
                approvalCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD4EDDA" } };
            } else if (item.approval_status === "pending") {
                approvalCell.font = { color: { argb: "FF664D03" } };
                approvalCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF3CD" } };
            } else if (item.approval_status === "rejected") {
                approvalCell.font = { color: { argb: "FF721C24" } };
                approvalCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8D7DA" } };
            }

            // Color code work type
            const workTypeCell = row.getCell("work_type");
            if (workTypeLabel === "Onsite") {
                workTypeCell.font = { bold: true, color: { argb: "FF0D3B66" } };
                workTypeCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD0E8FF" } };
            } else if (workTypeLabel === "Offsite") {
                workTypeCell.font = { bold: true, color: { argb: "FF5C3317" } };
                workTypeCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDE8D0" } };
            } else if (workTypeLabel.includes("→")) {
                workTypeCell.font = { bold: true, color: { argb: "FF3D0A60" } };
                workTypeCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFE0FF" } };
            }

            // Wrap text for long content
            ["location_in","location_out","offsite_reason","checkout_offsite_reason","notes","rejection_reason"].forEach(key => {
                row.getCell(key).alignment = { wrapText: true, vertical: "top" };
            });
        });

        // Add summary section
        const summaryStartRow = worksheet.rowCount + 2;

        // Summary title
        const totalCols = 22;
        worksheet.mergeCells(`A${summaryStartRow}:F${summaryStartRow}`);
        const summaryTitle = worksheet.getCell(`A${summaryStartRow}`);
        summaryTitle.value = "STATISTIK PRESENSI";
        summaryTitle.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
        summaryTitle.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF2E4057" },
        };
        summaryTitle.alignment = { horizontal: "center", vertical: "middle" };
        worksheet.getRow(summaryStartRow).height = 25;

        // Summary data
        const summaryData = [
            ["Total Records", stats.total],
            ["Hadir (Tepat Waktu)", stats.present],
            ["Terlambat", stats.late],
            ["Pulang Awal", stats.early],
            ["Tidak Hadir", stats.absent],
            ["-", "-"],
            ["Onsite (Keseluruhan)", stats.onsite],
            ["Offsite (Keseluruhan)", stats.offsite],
            ["Mixed: Onsite Check-In → Offsite Check-Out", stats.mixed_onsite_to_offsite],
            ["-", "-"],
            ["Disetujui (Approved)", stats.approved],
            ["Menunggu Persetujuan", stats.pending],
            ["Ditolak", stats.rejected],
            ["-", "-"],
            ["Presensi dengan Foto", stats.with_photo],
        ];

        summaryData.forEach((item) => {
            if (item[0] === "-") { worksheet.addRow([]); return; }
            const row = worksheet.addRow([item[0], "", "", item[1]]);
            row.getCell(1).font = { bold: true };
            row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } };
            row.getCell(4).alignment = { horizontal: "center" };
            row.getCell(4).font = { bold: true };
        });

        // Add filters to header row
        worksheet.autoFilter = {
            from: { row: 5, column: 1 },
            to: { row: 5, column: 22 },
        };

        // Add borders to all cells with data
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber >= 5) {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: "thin", color: { argb: "FFD3D3D3" } },
                        left: { style: "thin", color: { argb: "FFD3D3D3" } },
                        bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
                        right: { style: "thin", color: { argb: "FFD3D3D3" } },
                    };
                });
            }
        });

        // Freeze header rows (freeze first 5 rows and first 2 columns for name navigation)
        worksheet.views = [{ state: "frozen", xSplit: 2, ySplit: 5 }];

        return await workbook.xlsx.writeBuffer();
    }

    /**
     * Export logbook data to Excel with improved formatting
     */
    async exportLogbookToExcel(data, dateRange) {
        const workbook = new ExcelJS.Workbook();

        workbook.creator = "Admin System";
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet("Laporan Logbook", {
            pageSetup: {
                paperSize: 9,
                orientation: "landscape",
                fitToPage: true,
            },
        });

        // Add title
        worksheet.mergeCells("A1:L1");
        const titleCell = worksheet.getCell("A1");
        titleCell.value = "LAPORAN LOGBOOK KARYAWAN";
        titleCell.font = { size: 16, bold: true };
        titleCell.alignment = { vertical: "middle", horizontal: "center" };
        titleCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE7E6E6" },
        };
        worksheet.getRow(1).height = 30;

        // Date range
        worksheet.mergeCells("A2:L2");
        const dateCell = worksheet.getCell("A2");
        dateCell.value = `Periode: ${this.formatDate(
            dateRange.start_date,
        )} - ${this.formatDate(dateRange.end_date)}`;
        dateCell.font = { size: 11, italic: true };
        dateCell.alignment = { vertical: "middle", horizontal: "center" };
        worksheet.getRow(2).height = 20;

        // Generated date
        worksheet.mergeCells("A3:L3");
        const generatedCell = worksheet.getCell("A3");
        generatedCell.value = `Digenerate pada: ${new Date().toLocaleString(
            "id-ID",
        )}`;
        generatedCell.font = { size: 9, italic: true };
        generatedCell.alignment = { vertical: "middle", horizontal: "center" };

        worksheet.addRow([]);

        // Set column widths and headers
        worksheet.columns = [
            { header: "No", key: "no", width: 5 },
            { header: "Tanggal", key: "date", width: 12 },
            { header: "Nama", key: "name", width: 25 },
            { header: "NIP", key: "nip", width: 15 },
            { header: "Divisi", key: "division", width: 20 },
            { header: "Periode", key: "periode", width: 12 },
            { header: "Waktu", key: "time", width: 10 },
            { header: "Aktivitas", key: "activity", width: 35 },
            { header: "Deskripsi", key: "description", width: 50 },
            { header: "Status", key: "status", width: 12 },
            { header: "Reviewer", key: "reviewer", width: 25 },
            { header: "Catatan Review", key: "review_notes", width: 40 },
        ];

        // Style header row
        const headerRow = worksheet.getRow(5);
        headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
        headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF70AD47" },
        };
        headerRow.alignment = {
            vertical: "middle",
            horizontal: "center",
            wrapText: true,
        };
        headerRow.height = 30;

        // Calculate statistics
        const stats = {
            total: data.length,
            approved: data.filter((l) => l.status === "approved").length,
            pending: data.filter((l) => l.status === "pending").length,
            rejected: data.filter((l) => l.status === "rejected").length,
        };

        // Add data rows
        data.forEach((item, index) => {
            const row = worksheet.addRow({
                no: index + 1,
                date: this.formatDate(item.date),
                name: item.user?.name || "-",
                nip: item.user?.nip || "-",
                division: item.user?.division?.name || "-",
                periode: item.user?.periode || "-",
                time: item.time || "-",
                activity: item.activity || "-",
                description: item.description || "-",
                status: this.translateStatus(item.status),
                reviewer: item.reviewer?.name || "-",
                review_notes: item.review_notes || "-",
            });

            // Add alternating row colors
            if (index % 2 === 0) {
                row.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFF8F9FA" },
                };
            }

            // Center align specific columns
            row.getCell("no").alignment = {
                horizontal: "center",
                vertical: "middle",
            };
            row.getCell("date").alignment = {
                horizontal: "center",
                vertical: "middle",
            };
            row.getCell("time").alignment = {
                horizontal: "center",
                vertical: "middle",
            };
            row.getCell("status").alignment = {
                horizontal: "center",
                vertical: "middle",
            };

            // Color code status
            const statusCell = row.getCell("status");
            statusCell.font = { bold: true };
            if (item.status === "approved") {
                statusCell.font = {
                    ...statusCell.font,
                    color: { argb: "FF008000" },
                };
                statusCell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFD4EDDA" },
                };
            } else if (item.status === "pending") {
                statusCell.font = {
                    ...statusCell.font,
                    color: { argb: "FFFF6600" },
                };
                statusCell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFFFF3CD" },
                };
            } else if (item.status === "rejected") {
                statusCell.font = {
                    ...statusCell.font,
                    color: { argb: "FFFF0000" },
                };
                statusCell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFF8D7DA" },
                };
            }

            // Wrap text for long content
            row.getCell("activity").alignment = {
                wrapText: true,
                vertical: "top",
            };
            row.getCell("description").alignment = {
                wrapText: true,
                vertical: "top",
            };
            row.getCell("review_notes").alignment = {
                wrapText: true,
                vertical: "top",
            };
        });

        // Add summary section
        const summaryStartRow = worksheet.rowCount + 2;

        // Summary title
        worksheet.mergeCells(`A${summaryStartRow}:E${summaryStartRow}`);
        const summaryTitle = worksheet.getCell(`A${summaryStartRow}`);
        summaryTitle.value = "STATISTIK LOGBOOK";
        summaryTitle.font = { bold: true, size: 12 };
        summaryTitle.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE7E6E6" },
        };
        summaryTitle.alignment = { horizontal: "center", vertical: "middle" };
        worksheet.getRow(summaryStartRow).height = 25;

        // Summary data
        const summaryData = [
            ["Total Records", stats.total],
            ["Disetujui", stats.approved],
            ["Menunggu Review", stats.pending],
            ["Ditolak", stats.rejected],
        ];

        summaryData.forEach((item, index) => {
            const row = worksheet.addRow([item[0], "", "", item[1]]);
            row.getCell(1).font = { bold: true };
            row.getCell(1).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF2F2F2" },
            };
            row.getCell(4).alignment = { horizontal: "center" };
            row.getCell(4).font = { bold: true };
        });

        // Add filters to header row
        worksheet.autoFilter = {
            from: { row: 5, column: 1 },
            to: { row: 5, column: 12 },
        };

        // Add borders to all cells with data
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber >= 5) {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: "thin", color: { argb: "FFD3D3D3" } },
                        left: { style: "thin", color: { argb: "FFD3D3D3" } },
                        bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
                        right: { style: "thin", color: { argb: "FFD3D3D3" } },
                    };
                });
            }
        });

        // Freeze header rows
        worksheet.views = [{ state: "frozen", xSplit: 0, ySplit: 5 }];

        return await workbook.xlsx.writeBuffer();
    }

    /**
     * Export leave data to Excel with improved formatting
     */
    async exportLeaveToExcel(data, dateRange) {
        const workbook = new ExcelJS.Workbook();

        workbook.creator = "Admin System";
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet("Laporan Izin Cuti", {
            pageSetup: {
                paperSize: 9,
                orientation: "landscape",
                fitToPage: true,
            },
        });

        // Add title
        worksheet.mergeCells("A1:M1");
        const titleCell = worksheet.getCell("A1");
        titleCell.value = "LAPORAN IZIN / CUTI KARYAWAN";
        titleCell.font = { size: 16, bold: true };
        titleCell.alignment = { vertical: "middle", horizontal: "center" };
        titleCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE7E6E6" },
        };
        worksheet.getRow(1).height = 30;

        // Date range
        worksheet.mergeCells("A2:M2");
        const dateCell = worksheet.getCell("A2");
        dateCell.value = `Periode: ${this.formatDate(
            dateRange.start_date,
        )} - ${this.formatDate(dateRange.end_date)}`;
        dateCell.font = { size: 11, italic: true };
        dateCell.alignment = { vertical: "middle", horizontal: "center" };
        worksheet.getRow(2).height = 20;

        // Generated date
        worksheet.mergeCells("A3:M3");
        const generatedCell = worksheet.getCell("A3");
        generatedCell.value = `Digenerate pada: ${new Date().toLocaleString(
            "id-ID",
        )}`;
        generatedCell.font = { size: 9, italic: true };
        generatedCell.alignment = { vertical: "middle", horizontal: "center" };

        worksheet.addRow([]);

        // Set column widths and headers
        worksheet.columns = [
            { header: "No", key: "no", width: 5 },
            { header: "Nama", key: "name", width: 25 },
            { header: "NIP", key: "nip", width: 15 },
            { header: "Divisi", key: "division", width: 20 },
            { header: "Periode", key: "periode", width: 12 },
            { header: "Sumber Magang", key: "sumber_magang", width: 15 },
            { header: "Jenis", key: "type", width: 15 },
            { header: "Tanggal Mulai", key: "start_date", width: 15 },
            { header: "Tanggal Selesai", key: "end_date", width: 15 },
            { header: "Durasi (Hari)", key: "duration", width: 12 },
            { header: "Alasan", key: "reason", width: 50 },
            { header: "Status", key: "status", width: 12 },
            { header: "Reviewer", key: "reviewer", width: 25 },
            { header: "Catatan Review", key: "review_notes", width: 40 },
        ];

        // Style header row
        const headerRow = worksheet.getRow(5);
        headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
        headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFED7D31" },
        };
        headerRow.alignment = {
            vertical: "middle",
            horizontal: "center",
            wrapText: true,
        };
        headerRow.height = 30;

        // Calculate statistics
        const stats = {
            total: data.length,
            approved: data.filter((l) => l.status === "approved").length,
            pending: data.filter((l) => l.status === "pending").length,
            rejected: data.filter((l) => l.status === "rejected").length,
            izin_sakit: data.filter((l) => l.type === "izin_sakit").length,
            izin_keperluan: data.filter((l) => l.type === "izin_keperluan")
                .length,
            totalDays: data.reduce((sum, l) => sum + (l.duration || 0), 0),
        };

        // Add data rows
        data.forEach((item, index) => {
            const row = worksheet.addRow({
                no: index + 1,
                name: item.user?.name || "-",
                nip: item.user?.nip || "-",
                division: item.user?.division?.name || "-",
                periode: item.user?.periode || "-",
                sumber_magang: item.user?.sumber_magang || "-",
                type:
                    item.type === "izin_sakit"
                        ? "Izin Sakit"
                        : "Izin Keperluan",
                start_date: this.formatDate(item.start_date),
                end_date: this.formatDate(item.end_date),
                duration: item.duration || 0,
                reason: item.reason || "-",
                status: this.translateStatus(item.status),
                reviewer: item.reviewer?.name || "-",
                review_notes: item.review_notes || "-",
            });

            // Add alternating row colors
            if (index % 2 === 0) {
                row.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFF8F9FA" },
                };
            }

            // Center align specific columns
            row.getCell("no").alignment = {
                horizontal: "center",
                vertical: "middle",
            };
            row.getCell("type").alignment = {
                horizontal: "center",
                vertical: "middle",
            };
            row.getCell("start_date").alignment = {
                horizontal: "center",
                vertical: "middle",
            };
            row.getCell("end_date").alignment = {
                horizontal: "center",
                vertical: "middle",
            };
            row.getCell("duration").alignment = {
                horizontal: "center",
                vertical: "middle",
            };
            row.getCell("status").alignment = {
                horizontal: "center",
                vertical: "middle",
            };

            // Color code status
            const statusCell = row.getCell("status");
            statusCell.font = { bold: true };
            if (item.status === "approved") {
                statusCell.font = {
                    ...statusCell.font,
                    color: { argb: "FF008000" },
                };
                statusCell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFD4EDDA" },
                };
            } else if (item.status === "pending") {
                statusCell.font = {
                    ...statusCell.font,
                    color: { argb: "FFFF6600" },
                };
                statusCell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFFFF3CD" },
                };
            } else if (item.status === "rejected") {
                statusCell.font = {
                    ...statusCell.font,
                    color: { argb: "FFFF0000" },
                };
                statusCell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFF8D7DA" },
                };
            }

            // Wrap text for long content
            row.getCell("reason").alignment = {
                wrapText: true,
                vertical: "top",
            };
            row.getCell("review_notes").alignment = {
                wrapText: true,
                vertical: "top",
            };
        });

        // Add summary section
        const summaryStartRow = worksheet.rowCount + 2;

        // Summary title
        worksheet.mergeCells(`A${summaryStartRow}:E${summaryStartRow}`);
        const summaryTitle = worksheet.getCell(`A${summaryStartRow}`);
        summaryTitle.value = "STATISTIK IZIN/CUTI";
        summaryTitle.font = { bold: true, size: 12 };
        summaryTitle.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE7E6E6" },
        };
        summaryTitle.alignment = { horizontal: "center", vertical: "middle" };
        worksheet.getRow(summaryStartRow).height = 25;

        // Summary data
        const summaryData = [
            ["Total Pengajuan", stats.total],
            ["Disetujui", stats.approved],
            ["Menunggu Persetujuan", stats.pending],
            ["Ditolak", stats.rejected],
            ["Izin Sakit", stats.izin_sakit],
            ["Izin Keperluan", stats.izin_keperluan],
            ["Total Hari Izin", stats.totalDays],
        ];

        summaryData.forEach((item, index) => {
            const row = worksheet.addRow([item[0], "", "", item[1]]);
            row.getCell(1).font = { bold: true };
            row.getCell(1).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF2F2F2" },
            };
            row.getCell(4).alignment = { horizontal: "center" };
            row.getCell(4).font = { bold: true };
        });

        // Add filters to header row
        worksheet.autoFilter = {
            from: { row: 5, column: 1 },
            to: { row: 5, column: 14 },
        };

        // Add borders to all cells with data
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber >= 5) {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: "thin", color: { argb: "FFD3D3D3" } },
                        left: { style: "thin", color: { argb: "FFD3D3D3" } },
                        bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
                        right: { style: "thin", color: { argb: "FFD3D3D3" } },
                    };
                });
            }
        });

        // Freeze header rows
        worksheet.views = [{ state: "frozen", xSplit: 0, ySplit: 5 }];

        return await workbook.xlsx.writeBuffer();
    }

    /**
     * Export division report to Excel with improved formatting
     */
    async exportDivisionToExcel(data, dateRange = null) {
        const workbook = new ExcelJS.Workbook();

        workbook.creator = "Admin System";
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet("Laporan per Divisi", {
            pageSetup: {
                paperSize: 9,
                orientation: "portrait",
                fitToPage: true,
            },
        });

        // Add title
        worksheet.mergeCells("A1:F1");
        const titleCell = worksheet.getCell("A1");
        titleCell.value = "LAPORAN STATISTIK PER DIVISI";
        titleCell.font = { size: 16, bold: true };
        titleCell.alignment = { vertical: "middle", horizontal: "center" };
        titleCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE7E6E6" },
        };
        worksheet.getRow(1).height = 30;

        // Date range if provided
        if (dateRange) {
            worksheet.mergeCells("A2:F2");
            const dateCell = worksheet.getCell("A2");
            dateCell.value = `Periode: ${this.formatDate(
                dateRange.start_date,
            )} - ${this.formatDate(dateRange.end_date)}`;
            dateCell.font = { size: 11, italic: true };
            dateCell.alignment = { vertical: "middle", horizontal: "center" };
            worksheet.getRow(2).height = 20;
        }

        // Generated date
        const genRow = dateRange ? 3 : 2;
        worksheet.mergeCells(`A${genRow}:F${genRow}`);
        const generatedCell = worksheet.getCell(`A${genRow}`);
        generatedCell.value = `Digenerate pada: ${new Date().toLocaleString(
            "id-ID",
        )}`;
        generatedCell.font = { size: 9, italic: true };
        generatedCell.alignment = { vertical: "middle", horizontal: "center" };

        worksheet.addRow([]);

        const headerRow = dateRange ? 5 : 4;

        // Set column widths and headers
        worksheet.columns = [
            { header: "No", key: "no", width: 5 },
            { header: "Nama Divisi", key: "division_name", width: 30 },
            { header: "Total Anggota", key: "total_members", width: 15 },
            { header: "Presensi Hari Ini", key: "today_attendance", width: 18 },
            {
                header: "Presensi Bulan Ini",
                key: "monthly_attendance",
                width: 20,
            },
            {
                header: "Tingkat Kehadiran (%)",
                key: "attendance_rate",
                width: 20,
            },
        ];

        // Style header row
        const header = worksheet.getRow(headerRow);
        header.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
        header.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF5B9BD5" },
        };
        header.alignment = {
            vertical: "middle",
            horizontal: "center",
            wrapText: true,
        };
        header.height = 30;

        // Add data rows
        data.forEach((item, index) => {
            const row = worksheet.addRow({
                no: index + 1,
                division_name: item.division_name || "-",
                total_members: item.total_members || 0,
                today_attendance: item.today_attendance || 0,
                monthly_attendance: item.monthly_attendance || 0,
                attendance_rate: `${item.attendance_rate || 0}%`,
            });

            // Add alternating row colors
            if (index % 2 === 0) {
                row.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFF8F9FA" },
                };
            }

            // Center align numeric columns
            row.getCell("no").alignment = {
                horizontal: "center",
                vertical: "middle",
            };
            row.getCell("total_members").alignment = {
                horizontal: "center",
                vertical: "middle",
            };
            row.getCell("today_attendance").alignment = {
                horizontal: "center",
                vertical: "middle",
            };
            row.getCell("monthly_attendance").alignment = {
                horizontal: "center",
                vertical: "middle",
            };
            row.getCell("attendance_rate").alignment = {
                horizontal: "center",
                vertical: "middle",
            };

            // Color code attendance rate
            const rateCell = row.getCell("attendance_rate");
            const rate = parseFloat(item.attendance_rate || 0);
            if (rate >= 90) {
                rateCell.font = { color: { argb: "FF008000" }, bold: true };
                rateCell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFD4EDDA" },
                };
            } else if (rate >= 75) {
                rateCell.font = { color: { argb: "FFFF6600" }, bold: true };
                rateCell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFFFF3CD" },
                };
            } else {
                rateCell.font = { color: { argb: "FFFF0000" }, bold: true };
                rateCell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFF8D7DA" },
                };
            }
        });

        // Add summary
        const summaryStartRow = worksheet.rowCount + 2;

        worksheet.mergeCells(`A${summaryStartRow}:D${summaryStartRow}`);
        const summaryTitle = worksheet.getCell(`A${summaryStartRow}`);
        summaryTitle.value = "RINGKASAN";
        summaryTitle.font = { bold: true, size: 12 };
        summaryTitle.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE7E6E6" },
        };
        summaryTitle.alignment = { horizontal: "center", vertical: "middle" };

        const totalMembers = data.reduce(
            (sum, d) => sum + (d.total_members || 0),
            0,
        );
        const totalToday = data.reduce(
            (sum, d) => sum + (d.today_attendance || 0),
            0,
        );
        const avgRate =
            data.length > 0
                ? (
                      data.reduce(
                          (sum, d) =>
                              sum + (parseFloat(d.attendance_rate) || 0),
                          0,
                      ) / data.length
                  ).toFixed(2)
                : 0;

        const summaryData = [
            ["Total Divisi", data.length],
            ["Total Anggota", totalMembers],
            ["Hadir Hari Ini", totalToday],
            ["Rata-rata Kehadiran", `${avgRate}%`],
        ];

        summaryData.forEach((item) => {
            const row = worksheet.addRow([item[0], "", "", item[1]]);
            row.getCell(1).font = { bold: true };
            row.getCell(1).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF2F2F2" },
            };
            row.getCell(4).alignment = { horizontal: "center" };
            row.getCell(4).font = { bold: true };
        });

        // Add filters
        worksheet.autoFilter = {
            from: { row: headerRow, column: 1 },
            to: { row: headerRow, column: 6 },
        };

        // Add borders to all cells with data
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber >= headerRow) {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: "thin", color: { argb: "FFD3D3D3" } },
                        left: { style: "thin", color: { argb: "FFD3D3D3" } },
                        bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
                        right: { style: "thin", color: { argb: "FFD3D3D3" } },
                    };
                });
            }
        });

        // Freeze header rows
        worksheet.views = [{ state: "frozen", xSplit: 0, ySplit: headerRow }];

        return await workbook.xlsx.writeBuffer();
    }

    /**
     * Export summary report with all three types of data (attendance, logbook, leave)
     */
    async exportSummaryToExcel(data, dateRange) {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = "Admin System";
        workbook.created = new Date();
        workbook.modified = new Date();

        // Add attendance sheet
        await this.addAttendanceSheet(workbook, data.attendances, dateRange);

        // Add logbook sheet
        await this.addLogbookSheet(workbook, data.logbooks, dateRange);

        // Add leave sheet
        await this.addLeaveSheet(workbook, data.leaves, dateRange);

        return await workbook.xlsx.writeBuffer();
    }

    /**
     * Add attendance data to workbook
     */
    async addAttendanceSheet(workbook, attendances, dateRange) {
        const worksheet = workbook.addWorksheet("Presensi", {
            pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
        });

        worksheet.mergeCells("A1:V1");
        const titleCell = worksheet.getCell("A1");
        titleCell.value = "LAPORAN PRESENSI KARYAWAN";
        titleCell.font = { size: 16, bold: true };
        titleCell.alignment = { vertical: "middle", horizontal: "center" };
        titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE7E6E6" } };
        worksheet.getRow(1).height = 30;

        worksheet.mergeCells("A2:V2");
        const dateCell = worksheet.getCell("A2");
        dateCell.value = `Periode: ${this.formatDate(dateRange.start_date)} - ${this.formatDate(dateRange.end_date)}`;
        dateCell.font = { size: 11, italic: true };
        worksheet.getRow(2).height = 20;

        const colDefs = [
            { h: "No", w: 5 }, { h: "Tanggal", w: 13 }, { h: "Nama", w: 25 }, { h: "NIP", w: 15 },
            { h: "Divisi", w: 20 }, { h: "Periode", w: 12 }, { h: "Sumber Magang", w: 15 },
            { h: "Jam Masuk", w: 12 }, { h: "Jam Keluar", w: 12 }, { h: "Tipe Kerja", w: 18 },
            { h: "Status Kehadiran", w: 16 }, { h: "Status Approval", w: 16 },
            { h: "Lokasi Check-In", w: 38 }, { h: "Lokasi Check-Out", w: 38 },
            { h: "Keterangan Offsite Check-In", w: 35 }, { h: "Keterangan Offsite Check-Out", w: 35 },
            { h: "Koordinat Check-In", w: 25 }, { h: "Koordinat Check-Out", w: 25 },
            { h: "Foto Check-In", w: 14 }, { h: "Foto Check-Out", w: 14 },
            { h: "Catatan", w: 35 }, { h: "Alasan Penolakan", w: 35 },
        ];
        worksheet.columns = colDefs.map(c => ({ width: c.w }));

        const headerRow = 4;
        colDefs.forEach((col, i) => {
            const cell = worksheet.getCell(headerRow, i + 1);
            cell.value = col.h;
            cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2E4057" } };
            cell.alignment = { vertical: "center", horizontal: "center", wrapText: true };
        });
        worksheet.getRow(headerRow).height = 35;

        const getWTLabel = (a) => {
            if (!a.work_type) return "-";
            if (!a.check_out_time) return a.work_type === "onsite" ? "Onsite" : "Offsite";
            if (a.work_type === "onsite" && a.checkout_offsite_reason) return "Onsite \u2192 Offsite";
            if (a.work_type === "offsite" && !a.checkout_offsite_reason) return "Offsite \u2192 Onsite";
            return a.work_type === "onsite" ? "Onsite" : "Offsite";
        };

        attendances.forEach((a, idx) => {
            const row = headerRow + idx + 1;
            const wt = getWTLabel(a);
            const vals = [
                idx + 1, this.formatDate(a.date), a.user?.name || "-", a.user?.nip || "-",
                a.user?.division?.name || "-", a.user?.periode || "-", a.user?.sumber_magang || "-",
                a.check_in_time || "-", a.check_out_time || "Belum Check-Out", wt,
                this.translateStatus(a.status), this.translateStatus(a.approval_status),
                a.check_in_address || "-",
                a.check_out_address || (a.check_out_time ? "-" : "Belum Check-Out"),
                a.offsite_reason || "-", a.checkout_offsite_reason || "-",
                (a.check_in_latitude && a.check_in_longitude)
                    ? `${parseFloat(a.check_in_latitude).toFixed(6)}, ${parseFloat(a.check_in_longitude).toFixed(6)}` : "-",
                (a.check_out_latitude && a.check_out_longitude)
                    ? `${parseFloat(a.check_out_latitude).toFixed(6)}, ${parseFloat(a.check_out_longitude).toFixed(6)}` : "-",
                a.check_in_photo ? "\u2713 Ada" : "-", a.check_out_photo ? "\u2713 Ada" : "-",
                a.notes || "-", a.rejection_reason || "-",
            ];
            vals.forEach((v, c) => { worksheet.getCell(row, c + 1).value = v; });

            if (idx % 2 === 0) {
                for (let c = 1; c <= 22; c++) {
                    const cell = worksheet.getCell(row, c);
                    if (!cell.fill || !cell.fill.fgColor) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8F9FA" } };
                }
            }
            [1, 2, 8, 9, 10, 11, 12, 19, 20].forEach(c => { worksheet.getCell(row, c).alignment = { horizontal: "center", vertical: "middle" }; });
            [13, 14, 15, 16, 21, 22].forEach(c => { worksheet.getCell(row, c).alignment = { wrapText: true, vertical: "top" }; });

            const sc = worksheet.getCell(row, 11);
            if (a.status === "present") { sc.font = { bold: true, color: { argb: "FF155724" } }; sc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD4EDDA" } }; }
            else if (a.status === "late") { sc.font = { bold: true, color: { argb: "FF664D03" } }; sc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF3CD" } }; }
            else if (a.status === "early") { sc.font = { bold: true, color: { argb: "FF0C5460" } }; sc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1ECF1" } }; }
            else if (a.status === "absent") { sc.font = { bold: true, color: { argb: "FF721C24" } }; sc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8D7DA" } }; }

            const ac = worksheet.getCell(row, 12);
            if (a.approval_status === "approved") { ac.font = { color: { argb: "FF155724" } }; ac.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD4EDDA" } }; }
            else if (a.approval_status === "pending") { ac.font = { color: { argb: "FF664D03" } }; ac.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF3CD" } }; }
            else if (a.approval_status === "rejected") { ac.font = { color: { argb: "FF721C24" } }; ac.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8D7DA" } }; }

            const wtc = worksheet.getCell(row, 10);
            if (wt === "Onsite") { wtc.font = { bold: true, color: { argb: "FF0D3B66" } }; wtc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD0E8FF" } }; }
            else if (wt === "Offsite") { wtc.font = { bold: true, color: { argb: "FF5C3317" } }; wtc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFDE8D0" } }; }
            else if (wt.includes("\u2192")) { wtc.font = { bold: true, color: { argb: "FF3D0A60" } }; wtc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFE0FF" } }; }
        });

        worksheet.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: headerRow, column: 22 } };
        worksheet.eachRow({ includeEmpty: false }, (row, rn) => {
            if (rn >= headerRow) {
                row.eachCell(cell => { cell.border = { top: { style: "thin", color: { argb: "FFD3D3D3" } }, left: { style: "thin", color: { argb: "FFD3D3D3" } }, bottom: { style: "thin", color: { argb: "FFD3D3D3" } }, right: { style: "thin", color: { argb: "FFD3D3D3" } } }; });
            }
        });
        worksheet.views = [{ state: "frozen", xSplit: 2, ySplit: headerRow }];
    }
    async addLogbookSheet(workbook, logbooks, dateRange) {
        const worksheet = workbook.addWorksheet("Logbook", {
            pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
        });

        worksheet.mergeCells("A1:L1");
        const titleCell = worksheet.getCell("A1");
        titleCell.value = "LAPORAN LOGBOOK";
        titleCell.font = { size: 16, bold: true, color: { argb: "FF000000" } };
        titleCell.alignment = { vertical: "middle", horizontal: "center" };
        titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE7E6E6" } };
        worksheet.getRow(1).height = 30;

        worksheet.mergeCells("A2:L2");
        const dateCell = worksheet.getCell("A2");
        dateCell.value = `Periode: ${this.formatDate(dateRange.start_date)} - ${this.formatDate(dateRange.end_date)}`;
        dateCell.font = { size: 11, italic: true };
        worksheet.getRow(2).height = 20;

        const colDefs = [
            { h: "No", w: 5 }, { h: "Tanggal", w: 12 }, { h: "Nama", w: 25 }, { h: "NIP", w: 15 },
            { h: "Divisi", w: 20 }, { h: "Periode", w: 12 }, { h: "Waktu", w: 10 },
            { h: "Aktivitas", w: 35 }, { h: "Deskripsi", w: 50 }, { h: "Status", w: 12 },
            { h: "Reviewer", w: 25 }, { h: "Catatan Review", w: 40 },
        ];
        worksheet.columns = colDefs.map(c => ({ width: c.w }));

        const headerRow = 4;
        colDefs.forEach((col, i) => {
            const cell = worksheet.getCell(headerRow, i + 1);
            cell.value = col.h;
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF70AD47" } };
            cell.alignment = { vertical: "center", horizontal: "center", wrapText: true };
        });
        worksheet.getRow(headerRow).height = 25;

        logbooks.forEach((logbook, idx) => {
            const row = headerRow + idx + 1;
            const vals = [
                idx + 1, this.formatDate(logbook.date), logbook.user?.name || "-", logbook.user?.nip || "-",
                logbook.user?.division?.name || "-", logbook.user?.periode || "-",
                logbook.time || "-", logbook.activity || "-", logbook.description || "-",
                this.translateStatus(logbook.status), logbook.reviewer?.name || "-", logbook.notes || "-",
            ];
            vals.forEach((v, c) => { worksheet.getCell(row, c + 1).value = v; });

            if (idx % 2 === 0) {
                for (let c = 1; c <= 12; c++) {
                    const cell = worksheet.getCell(row, c);
                    if (!cell.fill || !cell.fill.fgColor) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8F9FA" } };
                }
            }
            [1, 2, 7, 10].forEach(c => { worksheet.getCell(row, c).alignment = { horizontal: "center", vertical: "middle" }; });
            [8, 9, 12].forEach(c => { worksheet.getCell(row, c).alignment = { wrapText: true, vertical: "top" }; });

            const sc = worksheet.getCell(row, 10);
            sc.font = { bold: true };
            if (logbook.status === "approved") { sc.font = { ...sc.font, color: { argb: "FF008000" } }; sc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD4EDDA" } }; }
            else if (logbook.status === "pending") { sc.font = { ...sc.font, color: { argb: "FFFF6600" } }; sc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF3CD" } }; }
            else if (logbook.status === "rejected") { sc.font = { ...sc.font, color: { argb: "FFFF0000" } }; sc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8D7DA" } }; }
        });

        worksheet.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: headerRow, column: 12 } };
        worksheet.eachRow({ includeEmpty: false }, (row, rn) => {
            if (rn >= headerRow) {
                row.eachCell(cell => { cell.border = { top: { style: "thin", color: { argb: "FFD3D3D3" } }, left: { style: "thin", color: { argb: "FFD3D3D3" } }, bottom: { style: "thin", color: { argb: "FFD3D3D3" } }, right: { style: "thin", color: { argb: "FFD3D3D3" } } }; });
            }
        });
        worksheet.views = [{ state: "frozen", xSplit: 2, ySplit: headerRow }];
    }
    async addLeaveSheet(workbook, leaves, dateRange) {
        const worksheet = workbook.addWorksheet("Izin Cuti", {
            pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
        });

        worksheet.mergeCells("A1:N1");
        const titleCell = worksheet.getCell("A1");
        titleCell.value = "LAPORAN IZIN CUTI";
        titleCell.font = { size: 16, bold: true, color: { argb: "FF000000" } };
        titleCell.alignment = { vertical: "middle", horizontal: "center" };
        titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE7E6E6" } };
        worksheet.getRow(1).height = 30;

        worksheet.mergeCells("A2:N2");
        const dateCell = worksheet.getCell("A2");
        dateCell.value = `Periode: ${this.formatDate(dateRange.start_date)} - ${this.formatDate(dateRange.end_date)}`;
        dateCell.font = { size: 11, italic: true };
        worksheet.getRow(2).height = 20;

        const colDefs = [
            { h: "No", w: 5 }, { h: "Nama", w: 25 }, { h: "NIP", w: 15 }, { h: "Divisi", w: 20 },
            { h: "Periode", w: 12 }, { h: "Sumber Magang", w: 15 }, { h: "Jenis", w: 15 },
            { h: "Tanggal Mulai", w: 15 }, { h: "Tanggal Selesai", w: 15 }, { h: "Durasi (Hari)", w: 12 },
            { h: "Alasan", w: 50 }, { h: "Status", w: 12 }, { h: "Reviewer", w: 25 }, { h: "Catatan Review", w: 40 },
        ];
        worksheet.columns = colDefs.map(c => ({ width: c.w }));

        const headerRow = 4;
        colDefs.forEach((col, i) => {
            const cell = worksheet.getCell(headerRow, i + 1);
            cell.value = col.h;
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC55A11" } };
            cell.alignment = { vertical: "center", horizontal: "center", wrapText: true };
        });
        worksheet.getRow(headerRow).height = 25;

        leaves.forEach((leave, idx) => {
            const row = headerRow + idx + 1;
            const vals = [
                idx + 1, leave.user?.name || "-", leave.user?.nip || "-", leave.user?.division?.name || "-",
                leave.user?.periode || "-", leave.user?.sumber_magang || "-",
                leave.type === "izin_sakit" ? "Izin Sakit" : "Izin Keperluan",
                this.formatDate(leave.start_date), this.formatDate(leave.end_date),
                leave.duration || 0, leave.reason || "-", this.translateStatus(leave.status),
                leave.reviewer?.name || "-", leave.review_notes || leave.notes || "-",
            ];
            vals.forEach((v, c) => { worksheet.getCell(row, c + 1).value = v; });

            if (idx % 2 === 0) {
                for (let c = 1; c <= 14; c++) {
                    const cell = worksheet.getCell(row, c);
                    if (!cell.fill || !cell.fill.fgColor) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8F9FA" } };
                }
            }
            [1, 7, 8, 9, 10, 12].forEach(c => { worksheet.getCell(row, c).alignment = { horizontal: "center", vertical: "middle" }; });
            [11, 14].forEach(c => { worksheet.getCell(row, c).alignment = { wrapText: true, vertical: "top" }; });

            const sc = worksheet.getCell(row, 12);
            sc.font = { bold: true };
            if (leave.status === "approved") { sc.font = { ...sc.font, color: { argb: "FF008000" } }; sc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD4EDDA" } }; }
            else if (leave.status === "pending") { sc.font = { ...sc.font, color: { argb: "FFFF6600" } }; sc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF3CD" } }; }
            else if (leave.status === "rejected") { sc.font = { ...sc.font, color: { argb: "FFFF0000" } }; sc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8D7DA" } }; }
        });

        worksheet.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: headerRow, column: 14 } };
        worksheet.eachRow({ includeEmpty: false }, (row, rn) => {
            if (rn >= headerRow) {
                row.eachCell(cell => { cell.border = { top: { style: "thin", color: { argb: "FFD3D3D3" } }, left: { style: "thin", color: { argb: "FFD3D3D3" } }, bottom: { style: "thin", color: { argb: "FFD3D3D3" } }, right: { style: "thin", color: { argb: "FFD3D3D3" } } }; });
            }
        });
        worksheet.views = [{ state: "frozen", xSplit: 2, ySplit: headerRow }];
    }
    // Helper methods
    formatDate(date) {
        if (!date) return "-";
        const d = new Date(date);
        return d.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }

    formatDateTime(datetime) {
        if (!datetime) return "-";
        const d = new Date(datetime);
        return d.toLocaleString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    }

    translateStatus(status) {
        const translations = {
            present: "Hadir",
            late: "Terlambat",
            absent: "Tidak Hadir",
            leave: "Izin",
            approved: "Disetujui",
            pending: "Menunggu",
            rejected: "Ditolak",
        };
        return translations[status] || status;
    }
}

export default new ExportService();
