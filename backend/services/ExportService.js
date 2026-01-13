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
            dateRange.start_date
        )} - ${this.formatDate(dateRange.end_date)}`;
        dateCell.font = { size: 11, italic: true };
        dateCell.alignment = { vertical: "middle", horizontal: "center" };
        worksheet.getRow(2).height = 20;

        // Add generated date
        worksheet.mergeCells("A3:N3");
        const generatedCell = worksheet.getCell("A3");
        generatedCell.value = `Digenerate pada: ${new Date().toLocaleString(
            "id-ID"
        )}`;
        generatedCell.font = { size: 9, italic: true };
        generatedCell.alignment = { vertical: "middle", horizontal: "center" };
        worksheet.getRow(3).height = 18;

        // Empty row for spacing
        worksheet.addRow([]);

        // Set column widths and headers (row 5)
        worksheet.columns = [
            { header: "No", key: "no", width: 5 },
            { header: "Tanggal", key: "date", width: 12 },
            { header: "Nama", key: "name", width: 25 },
            { header: "NIP", key: "nip", width: 15 },
            { header: "Divisi", key: "division", width: 20 },
            { header: "Periode", key: "periode", width: 12 },
            { header: "Sumber Magang", key: "sumber_magang", width: 15 },
            { header: "Jam Masuk", key: "check_in", width: 12 },
            { header: "Jam Keluar", key: "check_out", width: 12 },
            { header: "Tipe Kerja", key: "work_type", width: 12 },
            { header: "Status", key: "status", width: 12 },
            { header: "Lokasi Masuk", key: "location_in", width: 35 },
            { header: "Lokasi Keluar", key: "location_out", width: 35 },
            { header: "Keterangan", key: "notes", width: 40 },
        ];

        // Style header row (row 5)
        const headerRow = worksheet.getRow(5);
        headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
        headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF4472C4" },
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
            present: data.filter((a) => a.status === "present").length,
            late: data.filter((a) => a.status === "late").length,
            absent: data.filter((a) => a.status === "absent").length,
            onsite: data.filter((a) => a.work_type === "onsite").length,
            offsite: data.filter((a) => a.work_type === "offsite").length,
        };

        // Add data rows (starting from row 6)
        data.forEach((item, index) => {
            const row = worksheet.addRow({
                no: index + 1,
                date: this.formatDate(item.date),
                name: item.user?.name || "-",
                nip: item.user?.nip || "-",
                division: item.user?.division?.name || "-",
                periode: item.user?.periode || "-",
                sumber_magang: item.user?.sumber_magang || "-",
                check_in: item.check_in_time || "-",
                check_out: item.check_out_time || "-",
                work_type: item.work_type
                    ? item.work_type === "onsite"
                        ? "Onsite"
                        : "Offsite"
                    : "-",
                status: this.translateStatus(item.status),
                location_in: item.check_in_location || "-",
                location_out: item.check_out_location || "-",
                notes: item.notes || "-",
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
            row.getCell("check_in").alignment = {
                horizontal: "center",
                vertical: "middle",
            };
            row.getCell("check_out").alignment = {
                horizontal: "center",
                vertical: "middle",
            };
            row.getCell("work_type").alignment = {
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
            if (item.status === "present") {
                statusCell.font = {
                    ...statusCell.font,
                    color: { argb: "FF008000" },
                };
                statusCell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFD4EDDA" },
                };
            } else if (item.status === "late") {
                statusCell.font = {
                    ...statusCell.font,
                    color: { argb: "FFFF6600" },
                };
                statusCell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFFFF3CD" },
                };
            } else if (item.status === "absent") {
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
            row.getCell("location_in").alignment = {
                wrapText: true,
                vertical: "top",
            };
            row.getCell("location_out").alignment = {
                wrapText: true,
                vertical: "top",
            };
            row.getCell("notes").alignment = {
                wrapText: true,
                vertical: "top",
            };
        });

        // Add summary section
        const summaryStartRow = worksheet.rowCount + 2;

        // Summary title
        worksheet.mergeCells(`A${summaryStartRow}:E${summaryStartRow}`);
        const summaryTitle = worksheet.getCell(`A${summaryStartRow}`);
        summaryTitle.value = "STATISTIK PRESENSI";
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
            ["Hadir", stats.present],
            ["Terlambat", stats.late],
            ["Tidak Hadir", stats.absent],
            ["Onsite", stats.onsite],
            ["Offsite", stats.offsite],
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
                // Starting from header row
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
            dateRange.start_date
        )} - ${this.formatDate(dateRange.end_date)}`;
        dateCell.font = { size: 11, italic: true };
        dateCell.alignment = { vertical: "middle", horizontal: "center" };
        worksheet.getRow(2).height = 20;

        // Generated date
        worksheet.mergeCells("A3:L3");
        const generatedCell = worksheet.getCell("A3");
        generatedCell.value = `Digenerate pada: ${new Date().toLocaleString(
            "id-ID"
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

        const worksheet = workbook.addWorksheet("Laporan Izin/Cuti", {
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
            dateRange.start_date
        )} - ${this.formatDate(dateRange.end_date)}`;
        dateCell.font = { size: 11, italic: true };
        dateCell.alignment = { vertical: "middle", horizontal: "center" };
        worksheet.getRow(2).height = 20;

        // Generated date
        worksheet.mergeCells("A3:M3");
        const generatedCell = worksheet.getCell("A3");
        generatedCell.value = `Digenerate pada: ${new Date().toLocaleString(
            "id-ID"
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
                dateRange.start_date
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
            "id-ID"
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
            0
        );
        const totalToday = data.reduce(
            (sum, d) => sum + (d.today_attendance || 0),
            0
        );
        const avgRate =
            data.length > 0
                ? (
                      data.reduce(
                          (sum, d) =>
                              sum + (parseFloat(d.attendance_rate) || 0),
                          0
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
            pageSetup: {
                paperSize: 9,
                orientation: "landscape",
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 0,
            },
        });

        // Title
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

        // Date range
        worksheet.mergeCells("A2:N2");
        const dateCell = worksheet.getCell("A2");
        dateCell.value = `Periode: ${this.formatDate(
            dateRange.start_date
        )} - ${this.formatDate(dateRange.end_date)}`;
        dateCell.font = { size: 11, italic: true };
        worksheet.getRow(2).height = 20;

        // Headers
        const headers = [
            "No",
            "Tanggal",
            "Nama",
            "NIP",
            "Divisi",
            "Status Kehadiran",
            "Status Approval",
            "Jam Masuk",
            "Jam Keluar",
            "Tipe Kerja",
            "Periode",
            "Sumber Magang",
            "Deskripsi",
            "Catatan",
        ];

        const headerRow = 4;
        headers.forEach((header, index) => {
            const cell = worksheet.getCell(headerRow, index + 1);
            cell.value = header;
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF4472C4" },
            };
            cell.alignment = {
                vertical: "center",
                horizontal: "center",
                wrapText: true,
            };
        });
        worksheet.getRow(headerRow).height = 25;

        // Data rows
        attendances.forEach((attendance, index) => {
            const row = headerRow + index + 1;
            worksheet.getCell(row, 1).value = index + 1;
            worksheet.getCell(row, 2).value = this.formatDate(attendance.date);
            worksheet.getCell(row, 3).value = attendance.user?.name || "-";
            worksheet.getCell(row, 4).value = attendance.user?.nip || "-";
            worksheet.getCell(row, 5).value =
                attendance.user?.division?.name || "-";
            worksheet.getCell(row, 6).value = this.translateStatus(
                attendance.status
            );
            worksheet.getCell(row, 7).value = this.translateStatus(
                attendance.approval_status
            );
            worksheet.getCell(row, 8).value = attendance.check_in_time || "-";
            worksheet.getCell(row, 9).value = attendance.check_out_time || "-";
            worksheet.getCell(row, 10).value =
                attendance.work_type === "onsite" ? "Onsite" : "Offsite";
            worksheet.getCell(row, 11).value = attendance.user?.periode || "-";
            worksheet.getCell(row, 12).value =
                attendance.user?.sumber_magang || "-";
            worksheet.getCell(row, 13).value = attendance.description || "-";
            worksheet.getCell(row, 14).value = attendance.notes || "-";
        });

        // Column widths
        worksheet.columns = [
            { width: 5 },
            { width: 12 },
            { width: 15 },
            { width: 12 },
            { width: 15 },
            { width: 15 },
            { width: 15 },
            { width: 12 },
            { width: 12 },
            { width: 12 },
            { width: 10 },
            { width: 15 },
            { width: 20 },
            { width: 20 },
        ];

        // Add filters
        worksheet.autoFilter = {
            from: { row: headerRow, column: 1 },
            to: { row: headerRow, column: 14 },
        };

        // Add borders
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

        // Freeze header
        worksheet.views = [{ state: "frozen", xSplit: 0, ySplit: headerRow }];
    }

    /**
     * Add logbook data to workbook
     */
    async addLogbookSheet(workbook, logbooks, dateRange) {
        const worksheet = workbook.addWorksheet("Logbook", {
            pageSetup: {
                paperSize: 9,
                orientation: "landscape",
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 0,
            },
        });

        // Title
        worksheet.mergeCells("A1:L1");
        const titleCell = worksheet.getCell("A1");
        titleCell.value = "LAPORAN LOGBOOK";
        titleCell.font = { size: 16, bold: true, color: { argb: "FF000000" } };
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
            dateRange.start_date
        )} - ${this.formatDate(dateRange.end_date)}`;
        dateCell.font = { size: 11, italic: true };
        worksheet.getRow(2).height = 20;

        // Headers
        const headers = [
            "No",
            "Tanggal",
            "Nama",
            "NIP",
            "Divisi",
            "Aktivitas",
            "Deskripsi",
            "Periode",
            "Sumber Magang",
            "Status Approval",
            "Reviewer",
            "Catatan",
        ];

        const headerRow = 4;
        headers.forEach((header, index) => {
            const cell = worksheet.getCell(headerRow, index + 1);
            cell.value = header;
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF70AD47" },
            };
            cell.alignment = {
                vertical: "center",
                horizontal: "center",
                wrapText: true,
            };
        });
        worksheet.getRow(headerRow).height = 25;

        // Data rows
        logbooks.forEach((logbook, index) => {
            const row = headerRow + index + 1;
            worksheet.getCell(row, 1).value = index + 1;
            worksheet.getCell(row, 2).value = this.formatDate(logbook.date);
            worksheet.getCell(row, 3).value = logbook.user?.name || "-";
            worksheet.getCell(row, 4).value = logbook.user?.nip || "-";
            worksheet.getCell(row, 5).value =
                logbook.user?.division?.name || "-";
            worksheet.getCell(row, 6).value = logbook.activity || "-";
            worksheet.getCell(row, 7).value = logbook.description || "-";
            worksheet.getCell(row, 8).value = logbook.user?.periode || "-";
            worksheet.getCell(row, 9).value =
                logbook.user?.sumber_magang || "-";
            worksheet.getCell(row, 10).value = this.translateStatus(
                logbook.status
            );
            worksheet.getCell(row, 11).value = logbook.reviewer?.name || "-";
            worksheet.getCell(row, 12).value = logbook.notes || "-";
        });

        // Column widths
        worksheet.columns = [
            { width: 5 },
            { width: 12 },
            { width: 15 },
            { width: 12 },
            { width: 15 },
            { width: 15 },
            { width: 20 },
            { width: 10 },
            { width: 15 },
            { width: 15 },
            { width: 15 },
            { width: 20 },
        ];

        // Add filters
        worksheet.autoFilter = {
            from: { row: headerRow, column: 1 },
            to: { row: headerRow, column: 12 },
        };

        // Add borders
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

        // Freeze header
        worksheet.views = [{ state: "frozen", xSplit: 0, ySplit: headerRow }];
    }

    /**
     * Add leave data to workbook
     */
    async addLeaveSheet(workbook, leaves, dateRange) {
        const worksheet = workbook.addWorksheet("Izin Cuti", {
            pageSetup: {
                paperSize: 9,
                orientation: "landscape",
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 0,
            },
        });

        // Title
        worksheet.mergeCells("A1:N1");
        const titleCell = worksheet.getCell("A1");
        titleCell.value = "LAPORAN IZIN/CUTI";
        titleCell.font = { size: 16, bold: true, color: { argb: "FF000000" } };
        titleCell.alignment = { vertical: "middle", horizontal: "center" };
        titleCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE7E6E6" },
        };
        worksheet.getRow(1).height = 30;

        // Date range
        worksheet.mergeCells("A2:N2");
        const dateCell = worksheet.getCell("A2");
        dateCell.value = `Periode: ${this.formatDate(
            dateRange.start_date
        )} - ${this.formatDate(dateRange.end_date)}`;
        dateCell.font = { size: 11, italic: true };
        worksheet.getRow(2).height = 20;

        // Headers
        const headers = [
            "No",
            "Tanggal Mulai",
            "Tanggal Akhir",
            "Nama",
            "NIP",
            "Divisi",
            "Tipe",
            "Durasi (Hari)",
            "Alasan",
            "Periode",
            "Sumber Magang",
            "Status Approval",
            "Reviewer",
            "Catatan",
        ];

        const headerRow = 4;
        headers.forEach((header, index) => {
            const cell = worksheet.getCell(headerRow, index + 1);
            cell.value = header;
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFC55A11" },
            };
            cell.alignment = {
                vertical: "center",
                horizontal: "center",
                wrapText: true,
            };
        });
        worksheet.getRow(headerRow).height = 25;

        // Data rows
        leaves.forEach((leave, index) => {
            const row = headerRow + index + 1;
            worksheet.getCell(row, 1).value = index + 1;
            worksheet.getCell(row, 2).value = this.formatDate(leave.start_date);
            worksheet.getCell(row, 3).value = this.formatDate(leave.end_date);
            worksheet.getCell(row, 4).value = leave.user?.name || "-";
            worksheet.getCell(row, 5).value = leave.user?.nip || "-";
            worksheet.getCell(row, 6).value = leave.user?.division?.name || "-";
            worksheet.getCell(row, 7).value =
                leave.type === "izin_sakit" ? "Izin Sakit" : "Izin Keperluan";
            worksheet.getCell(row, 8).value = leave.duration || "-";
            worksheet.getCell(row, 9).value = leave.reason || "-";
            worksheet.getCell(row, 10).value = leave.user?.periode || "-";
            worksheet.getCell(row, 11).value = leave.user?.sumber_magang || "-";
            worksheet.getCell(row, 12).value = this.translateStatus(
                leave.status
            );
            worksheet.getCell(row, 13).value = leave.reviewer?.name || "-";
            worksheet.getCell(row, 14).value = leave.notes || "-";
        });

        // Column widths
        worksheet.columns = [
            { width: 5 },
            { width: 12 },
            { width: 12 },
            { width: 15 },
            { width: 12 },
            { width: 15 },
            { width: 15 },
            { width: 12 },
            { width: 20 },
            { width: 10 },
            { width: 15 },
            { width: 15 },
            { width: 15 },
            { width: 20 },
        ];

        // Add filters
        worksheet.autoFilter = {
            from: { row: headerRow, column: 1 },
            to: { row: headerRow, column: 14 },
        };

        // Add borders
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

        // Freeze header
        worksheet.views = [{ state: "frozen", xSplit: 0, ySplit: headerRow }];
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
