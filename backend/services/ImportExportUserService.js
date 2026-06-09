import ExcelJS from "exceljs";
import bcrypt from "bcryptjs";
import models from "../models/index.js";

const { User, Division } = models;

class ImportExportUserService {
    /**
     * Generate Excel template for user import
     * @returns {Promise<ExcelJS.Workbook>}
     */
    async generateUserTemplate() {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Template Import User");

        // Define columns - 20 fields (Supervisor dipilih manual di form)
        worksheet.columns = [
            { header: "No", key: "no", width: 5 },
            { header: "Nama Lengkap*", key: "name", width: 25 },
            { header: "Email*", key: "email", width: 30 },
            { header: "Password*", key: "password", width: 15 },
            { header: "NIP", key: "nip", width: 18 },
            { header: "Jabatan", key: "position", width: 20 },
            { header: "Telepon", key: "phone", width: 15 },
            { header: "Alamat", key: "address", width: 35 },
            { header: "Role*", key: "role", width: 12 },
            { header: "Divisi", key: "division", width: 20 },
            { header: "Periode*", key: "periode", width: 15 },
            { header: "Sumber Magang*", key: "sumber_magang", width: 15 },
            { header: "Status", key: "is_active", width: 12 },
            { header: "Bio", key: "bio", width: 30 },
            { header: "LinkedIn", key: "linkedin", width: 20 },
            { header: "Instagram", key: "instagram", width: 20 },
            { header: "Telegram", key: "telegram", width: 20 },
            { header: "GitHub", key: "github", width: 20 },
            { header: "Twitter", key: "twitter", width: 20 },
            { header: "Facebook", key: "facebook", width: 20 },
        ];

        // Style header row
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
        headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF2E75B6" },
        };

        // Add alternating row colors for example data
        const addExampleRow = (data, rowIndex) => {
            const row = worksheet.addRow(data);
            if (rowIndex % 2 === 0) {
                row.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFF8F9FA" },
                };
            }
        };
        headerRow.alignment = { vertical: "middle", horizontal: "center" };
        headerRow.height = 25;

        // Add example rows with various format variations
        addExampleRow({
            no: 1,
            name: "Budi Santoso",
            email: "budi.santoso@example.com",
            password: "password123",
            nip: "198001012005011001",
            position: "Senior Web Developer",
            phone: "081234567890",
            address: "Jl. Sudirman No. 123, Jakarta",
            role: "user",
            division: "IT Development",
            periode: "2024-01",
            sumber_magang: "kampus",
            is_active: "aktif",
        }, 2);

        addExampleRow({
            no: 2,
            name: "Siti Rahayu",
            email: "siti.rahayu@example.com",
            password: "secure456",
            nip: "",
            position: "Marketing Specialist",
            phone: "+628987654321",
            address: "Komp. Merdeka Blok A/5, Bandung",
            role: "Supervisor",
            division: "Marketing",
            periode: "Angkatan 15",
            sumber_magang: "Pemerintah",
            is_active: "1",
        }, 3);

        addExampleRow({
            no: 3,
            name: "Ahmad Wijaya",
            email: "ahmad.wijaya@example.com",
            password: "admin789",
            nip: "199005152015041002",
            position: "System Administrator",
            phone: "085612349876",
            address: "Jl. Diponegoro 45, Surabaya",
            role: "ADMIN",
            division: "",
            periode: "Q1-2024",
            sumber_magang: "Swasta",
            is_active: "true",
        }, 4);

        // Add instruction sheet
        const instructionSheet = workbook.addWorksheet("Panduan");
        instructionSheet.columns = [
            { header: "Field", key: "field", width: 25 },
            { header: "Keterangan", key: "description", width: 80 },
        ];

        const instructions = [
            {
                field: "No",
                description: "Nomor urut baris (opsional, hanya untuk referensi)",
            },
            {
                field: "Nama Lengkap*",
                description: "Nama lengkap user (wajib diisi)",
            },
            {
                field: "Email*",
                description:
                    "Email user (wajib diisi, format email valid). PENTING: Jika email sudah ada di sistem = UPDATE data existing, jika email baru = INSERT user baru",
            },
            {
                field: "Password",
                description:
                    "Password user (min 6 karakter). TIPS: Jika mengupdate user dan TIDAK INGIN mengubah password, KOSONGKAN kolom ini. Jika diisi, password akan diganti. Untuk user baru yang kosong, default-nya adalah 'password123'.",
            },
            {
                field: "NIP",
                description: "Nomor Induk Pegawai (opsional, bisa dikosongkan)",
            },
            {
                field: "Jabatan",
                description: "Jabatan atau posisi user (opsional)",
            },
            {
                field: "Telepon",
                description: "Nomor telepon user (opsional)",
            },
            {
                field: "Alamat",
                description: "Alamat lengkap user (opsional)",
            },
            {
                field: "Role*",
                description:
                    "Role user (wajib diisi). Hanya bisa diisi dengan: user, supervisor, atau admin.",
            },
            {
                field: "Divisi",
                description:
                    "Nama divisi (opsional). PENTING: Nama harus PERSIS sama dengan divisi di sistem. Kosongkan jika tidak ada divisi.",
            },
            {
                field: "Periode*",
                description:
                    "Batch/angkatan, contoh: 2024-01, Angkatan 15, Q1-2024 (wajib diisi, format bebas)",
            },
            {
                field: "Sumber Magang*",
                description:
                    "Sumber: kampus, pemerintah, swasta, internal, umum. Fleksibel: bisa 'Campus', 'Government', 'Private', 'Kampous' (sistem auto-correct)",
            },
            {
                field: "Status",
                description:
                    "Status user: aktif atau nonaktif (opsional, default: aktif). Fleksibel: bisa 'Aktif', '1', 'true', 'yes' untuk aktif | 'Nonaktif', '0', 'false', 'no' untuk nonaktif (sistem auto-convert)",
            },
            {
                field: "Bio",
                description: "Informasi profil atau biodata singkat user (opsional)",
            },
            {
                field: "LinkedIn / Instagram / Telegram / GitHub / Twitter / Facebook",
                description: "Tautan profil sosial media user (opsional). Anda dapat menyalin link URL atau meletakkan hyperlink secara langsung pada sel tersebut.",
            },
            {
                field: "",
                description: "",
            },
            {
                field: "═══ CARA EDIT DATA USER SECARA MASSAL ═══",
                description: "Panduan lengkap untuk mengedit informasi user secara massal melalui Excel",
            },
            {
                field: "",
                description: "",
            },
            {
                field: "📥 LANGKAH 1: Export Data",
                description:
                    "Di menu User Management, klik tombol 'Export Excel'.\n\nPilih filter yang diinginkan (periode, role, divisi, dll) untuk mendapatkan data user yang ingin diedit.\n\nFile Excel akan terdownload dengan data user existing.",
            },
            {
                field: "📝 LANGKAH 2: Edit di Excel",
                description:
                    "Buka file Excel hasil export. Edit data yang ingin diubah LANGSUNG di file tersebut.\n\nPENTING: JANGAN ubah kolom Email karena Email adalah identifier untuk update data.\n\nKolom yang bisa diedit: Nama Lengkap, NIP, Jabatan, Telepon, Alamat, Role, Divisi, Periode, Sumber Magang, Status, Bio, dan Tautan Sosial Media.\n\nSimpan file setelah selesai edit.",
            },
            {
                field: "📤 LANGKAH 3: Import Kembali",
                description:
                    "Kembali ke menu User Management, klik tombol 'Import Excel'.\n\nPilih file Excel yang sudah diedit. Sistem akan otomatis mendeteksi email yang sudah ada dan melakukan UPDATE data (bukan INSERT data baru).\n\nTunggu proses selesai dan cek hasilnya.",
            },
            {
                field: "🔥 FITUR SMART IMPORT (BARU)",
                description:
                    "Sistem kini mengenali otomatis file hasil Export Excel!\n\nAnda tidak perlu menggunakan template khusus. Anda bisa langsung meng-export data, edit di dalam file export tersebut, lalu upload ulang file export tersebut tanpa memodifikasi nama kolom.\n\nSistem akan membaca judul kolom dengan cerdas.",
            },
            {
                field: "✅ CONTOH KASUS EDIT MASSAL",
                description:
                    "KASUS 1 - Ubah divisi 50 user:\nExport user periode tertentu → Edit kolom 'Divisi' untuk 50 user sekaligus di Excel → Import kembali.\n\nKASUS 2 - Update periode batch:\nExport user tertentu → Edit kolom 'Periode' ke nilai baru → Import kembali.\n\nKASUS 3 - Ubah role beberapa user:\nExport user → Edit kolom 'Role' dari 'user' ke 'supervisor' → Import kembali.\n\nKASUS 4 - Update info kontak:\nExport user → Edit kolom 'Telepon' dan 'Alamat' → Import kembali.",
            },
            {
                field: "⚠️ HAL PENTING SAAT EDIT",
                description:
                    "1. JANGAN UBAH EMAIL - Email digunakan sebagai unique identifier untuk update.\n2. Pastikan format data tetap sama (tidak ada karakter aneh).\n3. Nama divisi harus PERSIS dengan yang ada di sistem (case-sensitive).\n4. Untuk tidak mengubah password existing, KOSONGKAN saja kolom Password.\n5. Field bertanda * tetap WAJIB diisi meski ini adalah update.\n6. Backup data sebelum import jika edit dalam jumlah besar.",
            },
            {
                field: "💡 TIPS EFISIENSI",
                description:
                    "1. Gunakan filter Excel untuk mengelompokkan data yang akan diedit.\n2. Gunakan Fill Down (Ctrl+D) untuk mengisi nilai yang sama ke banyak cell sekaligus.\n3. Gunakan Find & Replace (Ctrl+H) untuk mengganti nilai secara massal.\n4. Copy-paste dari Excel lain juga bisa dilakukan (format tetap terjaga).\n5. Bisa edit sebagian user saja, tidak harus semua data dalam file export.\n6. Hapus baris user yang tidak ingin diedit untuk mempercepat proses import.",
            },
            {
                field: "🔄 ALUR LENGKAP",
                description:
                    "Export (filter periode/divisi) → Buka file Excel → Edit data yang diperlukan (jangan ubah email) → Save file → Import Excel → Sistem deteksi email existing → Update data otomatis → Selesai!\n\nLebih cepat dari edit satu-satu di form.",
            },
            {
                field: "",
                description: "",
            },
            {
                field: "═══ TIPS & CATATAN UMUM ═══",
                description:
                    "✓ Field bertanda * WAJIB diisi\n✓ Email sama = UPDATE data existing\n✓ Email baru = INSERT user baru\n✓ Role, Sumber Magang & Status: case-insensitive & typo-tolerant\n✓ Nama Divisi: exact match atau kosongkan\n✓ Password: Kosongkan jika tidak ingin update password user lama\n✓ NIP, Phone, Address: optional\n✓ Supervisor: set manual di Edit User\n✓ Edit massal: Export → Edit Excel → Import kembali",
            },
        ];

        instructionSheet.addRows(instructions);

        // Style instruction header
        const instHeaderRow = instructionSheet.getRow(1);
        instHeaderRow.font = { bold: true };
        instHeaderRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF2E75B6" },
        };

        // Style section headers dynamically
        instructionSheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // skip main header
            
            const cellValue = row.getCell(1).value;
            if (cellValue && typeof cellValue === 'string') {
                const text = cellValue.trim();
                const isSectionHeader = [
                    "═══", "📥", "📝", "📤", "🔥", "✅", "⚠️", "💡", "🔄"
                ].some(prefix => text.startsWith(prefix));

                if (isSectionHeader) {
                    row.font = { bold: true, color: { argb: "FF000000" } };
                    row.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFFFD966" }, // Light orange for section headers
                    };
                }
            }
        });

        // Make description column wrap text
        instructionSheet.getColumn(2).alignment = {
            wrapText: true,
            vertical: "top",
        };

        // Set minimum row height for better readability
        instructionSheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                row.height = 30; // Minimum height
            }
        });

        return workbook;
    }

    /**
     * Export users with comprehensive filters to Excel
     * @param {Object} filters - { periode, role, division_id, sumber_magang, is_active, is_active_periode }
     * @returns {Promise<ExcelJS.Workbook>}
     */
    async exportUsersByPeriode(filters = {}) {
        try {
            const whereClause = {};

            // Build dynamic where clause based on filters
            if (filters.periode) whereClause.periode = filters.periode;
            if (filters.role) whereClause.role = filters.role;
            if (filters.division_id)
                whereClause.division_id = parseInt(filters.division_id);
            if (filters.sumber_magang)
                whereClause.sumber_magang = filters.sumber_magang;
            if (filters.is_active !== undefined)
                whereClause.is_active = filters.is_active;
            if (filters.is_active_periode !== undefined)
                whereClause.is_active_periode = filters.is_active_periode;

            console.log("Export filters:", whereClause);

            const users = await User.findAll({
                where: whereClause,
                include: [
                    {
                        model: Division,
                        as: "division",
                        attributes: ["id", "name", "supervisor_id"],
                        include: [
                            {
                                model: User,
                                as: "supervisor",
                                attributes: ["id", "name", "email"],
                            },
                        ],
                        required: false,
                    },
                    {
                        model: User,
                        as: "supervisorUser",
                        attributes: ["id", "name", "email"],
                    },
                ],
                attributes: [
                    "id",
                    "name",
                    "email",
                    "nip",
                    "position",
                    "phone",
                    "address",
                    "role",
                    "division_id",
                    "supervisor_id",
                    "periode",
                    "is_active_periode",
                    "sumber_magang",
                    "is_active",
                    "created_at",
                    "updated_at",
                    "bio",
                    "linkedin",
                    "instagram",
                    "telegram",
                    "github",
                    "twitter",
                    "facebook",
                ],
                order: [["name", "ASC"]],
            });

            console.log(`Found ${users.length} users for export`);

            const workbook = new ExcelJS.Workbook();

            // Generate worksheet title based on filters
            let sheetTitle = "Export Users";
            if (filters.periode) sheetTitle += ` - ${filters.periode}`;
            if (filters.role) sheetTitle += ` - ${filters.role.toUpperCase()}`;

            const worksheet = workbook.addWorksheet(
                sheetTitle.substring(0, 31)
            ); // Max 31 chars for sheet name

            // Define columns - COMPLETE VERSION
            worksheet.columns = [
                { header: "No", key: "no", width: 5 },
                { header: "Nama Lengkap", key: "name", width: 25 },
                { header: "Email", key: "email", width: 30 },
                { header: "NIP", key: "nip", width: 18 },
                { header: "Jabatan", key: "position", width: 20 },
                { header: "Telepon", key: "phone", width: 15 },
                { header: "Alamat", key: "address", width: 35 },
                { header: "Role", key: "role", width: 12 },
                { header: "Divisi", key: "division", width: 20 },
                { header: "Periode", key: "periode", width: 15 },
                {
                    header: "Status Periode",
                    key: "is_active_periode",
                    width: 15,
                },
                { header: "Sumber Magang", key: "sumber_magang", width: 15 },
                { header: "Supervisor", key: "supervisor", width: 25 },
                { header: "Status Aktif", key: "is_active", width: 12 },
                { header: "Tanggal Dibuat", key: "created_at", width: 18 },
                { header: "Terakhir Update", key: "updated_at", width: 18 },
                { header: "Bio", key: "bio", width: 30 },
                { header: "LinkedIn", key: "linkedin", width: 20 },
                { header: "Instagram", key: "instagram", width: 20 },
                { header: "Telegram", key: "telegram", width: 20 },
                { header: "GitHub", key: "github", width: 20 },
                { header: "Twitter", key: "twitter", width: 20 },
                { header: "Facebook", key: "facebook", width: 20 },
            ];

            // Style header
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
            headerRow.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF2E75B6" },
            };
            headerRow.alignment = { vertical: "middle", horizontal: "center" };
            headerRow.height = 25;

            // Add data with complete information
            users.forEach((user, index) => {
                const formatDate = (date) => {
                    if (!date) return "-";
                    try {
                        const d = new Date(date);
                        const day = d.getDate().toString().padStart(2, "0");
                        const month = (d.getMonth() + 1)
                            .toString()
                            .padStart(2, "0");
                        const year = d.getFullYear();
                        const hours = d.getHours().toString().padStart(2, "0");
                        const minutes = d
                            .getMinutes()
                            .toString()
                            .padStart(2, "0");
                        return `${day}/${month}/${year} ${hours}:${minutes}`;
                    } catch (e) {
                        return "-";
                    }
                };

                const row = worksheet.addRow({
                    no: index + 1,
                    name: user.name || "-",
                    email: user.email || "-",
                    nip: user.nip || "-",
                    position: user.position || "-",
                    phone: user.phone || "-",
                    address: user.address || "-",
                    role: user.role ? user.role.toUpperCase() : "-",
                    division: user.division?.name || "-",
                    periode: user.periode || "-",
                    is_active_periode: user.is_active_periode
                        ? "Aktif"
                        : "Historis",
                    sumber_magang: user.sumber_magang
                        ? user.sumber_magang.charAt(0).toUpperCase() +
                          user.sumber_magang.slice(1)
                        : "-",
                    supervisor: (user.supervisorUser ? `${user.supervisorUser.name} (${user.supervisorUser.email})` : 
                                 user.division?.supervisor ? `${user.division.supervisor.name} (${user.division.supervisor.email})` : "-"),
                    is_active: user.is_active ? "Aktif" : "Nonaktif",
                    created_at: formatDate(user.created_at),
                    updated_at: formatDate(user.updated_at),
                    bio: user.bio || "-",
                    linkedin: user.linkedin || "-",
                    instagram: user.instagram || "-",
                    telegram: user.telegram || "-",
                    github: user.github || "-",
                    twitter: user.twitter || "-",
                    facebook: user.facebook || "-",
                });

                // Alternating row colors for better readability
                if (index % 2 === 0) {
                    row.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFF8F9FA" },
                    };
                }
            });

            // Add summary with filter information
            worksheet.addRow([]);
            const summaryRow = worksheet.addRow([]);
            summaryRow.getCell(1).value = "Total User:";
            summaryRow.getCell(1).font = { bold: true };
            summaryRow.getCell(2).value = users.length;
            summaryRow.getCell(2).font = {
                bold: true,
                color: { argb: "FF2E75B6" },
            };

            // Add filter info
            if (Object.keys(filters).length > 0) {
                worksheet.addRow([]);
                const filterRow = worksheet.addRow([]);
                filterRow.getCell(1).value = "Filter:";
                filterRow.getCell(1).font = { bold: true };

                let filterText = [];
                if (filters.periode)
                    filterText.push(`Periode: ${filters.periode}`);
                if (filters.role) filterText.push(`Role: ${filters.role}`);
                if (filters.sumber_magang)
                    filterText.push(`Sumber Magang: ${filters.sumber_magang}`);
                if (filters.is_active !== undefined)
                    filterText.push(
                        `Status: ${filters.is_active ? "Aktif" : "Nonaktif"}`
                    );

                filterRow.getCell(2).value = filterText.join(" | ");
            }

            // Add export timestamp
            const timestampRow = worksheet.addRow([]);
            timestampRow.getCell(1).value = "Diekspor pada:";
            timestampRow.getCell(1).font = { italic: true };

            const now = new Date();
            const timestampStr = `${now
                .getDate()
                .toString()
                .padStart(2, "0")}/${(now.getMonth() + 1)
                .toString()
                .padStart(2, "0")}/${now.getFullYear()} ${now
                .getHours()
                .toString()
                .padStart(2, "0")}:${now
                .getMinutes()
                .toString()
                .padStart(2, "0")}`;

            timestampRow.getCell(2).value = timestampStr;
            timestampRow.getCell(2).font = { italic: true };

            return workbook;
        } catch (error) {
            console.error("Export users error:", error);
            throw new Error(`Failed to export users: ${error.message}`);
        }
    }

    /**
     * Import users from Excel file
     * @param {Buffer} fileBuffer - Excel file buffer
     * @returns {Promise<{success: boolean, message: string, data?: any, errors?: any[]}>}
     */
    async importUsersFromExcel(fileBuffer) {
        try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(fileBuffer);

            const worksheet = workbook.getWorksheet(1); // Read first sheet
            if (!worksheet) {
                return {
                    success: false,
                    message: "Sheet tidak ditemukan dalam file Excel",
                };
            }

            const users = [];
            const errors = [];

            // Get all divisions for validation
            const divisions = await Division.findAll({
                attributes: ["id", "name"],
            });
            const divisionMap = new Map(
                divisions.map((d) => [d.name.toLowerCase(), d.id])
            );

            // Helper function for fuzzy matching sumber_magang (case-insensitive, typo-tolerant)
            const normalizeSumberMagang = (input) => {
                if (!input) return null;
                const normalized = input.toLowerCase().trim();

                // Exact match
                const validSources = [
                    "kampus",
                    "pemerintah",
                    "swasta",
                    "internal",
                    "umum",
                ];
                if (validSources.includes(normalized)) return normalized;

                // Fuzzy matching for common typos
                const fuzzyMap = {
                    kampus: ["campus", "kampous", "kampuss", "kmpus", "kampua"],
                    pemerintah: [
                        "pemrintah",
                        "pemerintahan",
                        "pemda",
                        "govt",
                        "government",
                        "pemrintahan",
                    ],
                    swasta: ["swata", "private", "privat", "swsta"],
                    internal: ["intern", "intenal", "intrnal"],
                    umum: ["ummum", "public", "publik", "umu"],
                };

                for (const [correct, variations] of Object.entries(fuzzyMap)) {
                    if (
                        variations.some(
                            (v) =>
                                normalized.includes(v) || v.includes(normalized)
                        )
                    ) {
                        return correct;
                    }
                }

                return null; // Invalid if no match found
            };

            // Helper function for fuzzy matching role (case-insensitive, variations)
            const normalizeRole = (input) => {
                if (!input) return null;
                const normalized = input.toLowerCase().trim();

                // Exact match
                const validRoles = ["user", "supervisor", "admin"];
                if (validRoles.includes(normalized)) return normalized;

                // Fuzzy matching for common variations
                const fuzzyMap = {
                    user: [
                        "users",
                        "member",
                        "staff",
                        "employee",
                        "karyawan",
                        "pegawai",
                    ],
                    supervisor: [
                        "spv",
                        "supervisor",
                        "supv",
                        "supervisors",
                        "lead",
                        "manager",
                        "manajer",
                    ],
                    admin: [
                        "administrator",
                        "admn",
                        "admins",
                        "root",
                        "superadmin",
                        "super admin",
                    ],
                };

                for (const [correct, variations] of Object.entries(fuzzyMap)) {
                    if (
                        variations.some(
                            (v) =>
                                normalized.includes(v) || v.includes(normalized)
                        )
                    ) {
                        return correct;
                    }
                }

                return null; // Invalid if no match found
            };

            // Helper function to normalize status
            const normalizeStatus = (input) => {
                if (!input) return true; // default aktif
                const normalized = input.toString().toLowerCase().trim();
                const inactiveValues = ["nonaktif", "0", "false", "no", "tidak aktif", "non-aktif", "f"];
                if (inactiveValues.includes(normalized)) return false;
                return true;
            };

            // Helper function to extract cell value safely
            const getCellValue = (cell) => {
                if (!cell || cell.value == null) return null;
                if (typeof cell.value === 'object') {
                    if (cell.value.hyperlink) return cell.value.hyperlink.toString().trim();
                    if (cell.value.text) return cell.value.text.toString().trim();
                    if (cell.value.richText) return cell.value.richText.map(rt => rt.text).join('').trim();
                    return JSON.stringify(cell.value);
                }
                return cell.value.toString().trim();
            };

            // Map headers dynamically so users can upload Exported table directly
            const headerMap = {};
            const headerRow = worksheet.getRow(1);
            headerRow.eachCell((cell, colNumber) => {
                if (cell.value) {
                    let text = cell.value.toString().toLowerCase().trim();
                    text = text.replace(/\*/g, '').replace(/\(opsional\)/g, '').trim();
                    headerMap[text] = colNumber;
                }
            });

            // Helper to get column index by possible header names, with fallback to default template index
            const getCol = (possibleNames, defaultCol) => {
                for (const name of possibleNames) {
                    if (headerMap[name]) return headerMap[name];
                }
                return defaultCol;
            };

            const colName = getCol(['nama lengkap', 'nama'], 2);
            const colEmail = getCol(['email'], 3);
            const colPassword = getCol(['password'], 4);
            const colNip = getCol(['nip'], 5);
            const colPosition = getCol(['jabatan', 'posisi'], 6);
            const colPhone = getCol(['telepon', 'no. hp', 'no telepon'], 7);
            const colAddress = getCol(['alamat'], 8);
            const colRole = getCol(['role', 'peran'], 9);
            const colDivision = getCol(['divisi', 'bagian'], 10);
            const colPeriode = getCol(['periode', 'batch'], 11);
            const colSumberMagang = getCol(['sumber magang', 'sumber'], 12);
            const colStatus = getCol(['status', 'status aktif', 'status user'], 13);
            const colBio = getCol(['bio', 'biografi'], 14);
            const colLinkedin = getCol(['linkedin'], 15);
            const colInstagram = getCol(['instagram', 'ig'], 16);
            const colTelegram = getCol(['telegram', 'tg'], 17);
            const colGithub = getCol(['github'], 18);
            const colTwitter = getCol(['twitter', 'x'], 19);
            const colFacebook = getCol(['facebook', 'fb'], 20);

            // Skip header row
            let rowNumber = 1;
            worksheet.eachRow((row, rowIndex) => {
                if (rowIndex <= 1) return; // Skip header

                rowNumber = rowIndex;

                const rawSumberMagang = getCellValue(row.getCell(colSumberMagang));
                const normalizedSumberMagang = normalizeSumberMagang(rawSumberMagang);

                const rawRole = getCellValue(row.getCell(colRole));
                const normalizedRole = normalizeRole(rawRole);

                const rawStatus = getCellValue(row.getCell(colStatus));
                const normalizedStatus = normalizeStatus(rawStatus);

                const rowData = {
                    name: getCellValue(row.getCell(colName)),
                    email: getCellValue(row.getCell(colEmail)),
                    password: getCellValue(row.getCell(colPassword)),
                    nip: getCellValue(row.getCell(colNip)),
                    position: getCellValue(row.getCell(colPosition)),
                    phone: getCellValue(row.getCell(colPhone)),
                    address: getCellValue(row.getCell(colAddress)),
                    role: normalizedRole,
                    division: getCellValue(row.getCell(colDivision)),
                    periode: getCellValue(row.getCell(colPeriode)),
                    sumber_magang: normalizedSumberMagang,
                    is_active: normalizedStatus,
                    bio: getCellValue(row.getCell(colBio)),
                    linkedin: getCellValue(row.getCell(colLinkedin)),
                    instagram: getCellValue(row.getCell(colInstagram)),
                    telegram: getCellValue(row.getCell(colTelegram)),
                    github: getCellValue(row.getCell(colGithub)),
                    twitter: getCellValue(row.getCell(colTwitter)),
                    facebook: getCellValue(row.getCell(colFacebook)),
                };

                // Skip empty rows
                if (
                    !rowData.name &&
                    !rowData.email &&
                    !rowData.role
                ) {
                    return;
                }

                // Validation
                const rowErrors = [];

                if (!rowData.name) {
                    rowErrors.push("Nama wajib diisi");
                }

                if (!rowData.email) {
                    rowErrors.push("Email wajib diisi");
                } else if (!/\S+@\S+\.\S+/.test(rowData.email)) {
                    rowErrors.push("Format email tidak valid");
                }

                // Password check ONLY if provided
                if (rowData.password && rowData.password.length < 6) {
                    rowErrors.push("Password minimal 6 karakter");
                }

                if (!rowData.role) {
                    rowErrors.push(
                        `Role '${rawRole}' tidak valid. Gunakan: user, supervisor, admin`
                    );
                }

                if (!rowData.periode) {
                    rowErrors.push(
                        "Periode/Batch wajib diisi"
                    );
                }

                if (!rowData.sumber_magang) {
                    rowErrors.push(
                        `Sumber magang '${rawSumberMagang}' tidak valid.`
                    );
                }

                // Validate division if provided
                let divisionId = null;
                if (rowData.division) {
                    divisionId = divisionMap.get(
                        rowData.division.toLowerCase()
                    );
                    if (!divisionId) {
                        rowErrors.push(
                            `Divisi '${rowData.division}' tidak ditemukan.`
                        );
                    }
                }

                if (rowErrors.length > 0) {
                    errors.push({
                        row: rowNumber,
                        name: rowData.name,
                        email: rowData.email,
                        errors: rowErrors,
                    });
                } else {
                    users.push({ ...rowData, division_id: divisionId });
                }
            });

            // If there are validation errors, return them
            if (errors.length > 0) {
                return {
                    success: false,
                    message: `Ditemukan ${errors.length} error validasi`,
                    errors: errors,
                };
            }

            // Check for duplicate emails in file
            const emailSet = new Set();
            const duplicateEmails = [];
            users.forEach((user) => {
                if (emailSet.has(user.email)) {
                    duplicateEmails.push(user.email);
                } else {
                    emailSet.add(user.email);
                }
            });

            if (duplicateEmails.length > 0) {
                return {
                    success: false,
                    message: "Ditemukan email duplikat dalam file",
                    errors: duplicateEmails.map((email) => ({
                        email,
                        errors: ["Email duplikat dalam file"],
                    })),
                };
            }

            // Process users one by one (Update if exists, Create if new)
            let createdCount = 0;
            let updatedCount = 0;
            const importedUsers = [];

            for (const userData of users) {
                const existingUser = await User.findOne({
                    where: { email: userData.email },
                });

                if (existingUser) {
                    // UPDATE logic
                    const updateData = { ...userData };
                    
                    // If password is blank or a placeholder, don't update it
                    if (!updateData.password || updateData.password === "password123" || updateData.password === "********") {
                        delete updateData.password;
                    } else {
                        updateData.password = await bcrypt.hash(updateData.password, 10);
                    }

                    await existingUser.update(updateData);
                    updatedCount++;
                    importedUsers.push(existingUser);
                } else {
                    // CREATE logic
                    const newUser = { ...userData };
                    newUser.password = await bcrypt.hash(newUser.password || "password123", 10);
                    const createdUser = await User.create(newUser);
                    createdCount++;
                    importedUsers.push(createdUser);
                }
            }

            return {
                success: true,
                message: `Import selesai: ${createdCount} baru, ${updatedCount} diupdate.`,
                data: {
                    count: importedUsers.length,
                    created: createdCount,
                    updated: updatedCount,
                    users: importedUsers.slice(0, 10).map((u) => ({
                        id: u.id,
                        name: u.name,
                        email: u.email,
                        role: u.role,
                        periode: u.periode,
                    })),
                },
            };
        } catch (error) {
            console.error("Import users error:", error);
            return {
                success: false,
                message: "Gagal mengimpor user",
                error: error.message,
            };
        }
    }
}

export default new ImportExportUserService();
