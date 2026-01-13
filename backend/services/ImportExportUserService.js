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

        // Define columns - 11 fields (Supervisor dipilih manual di form)
        worksheet.columns = [
            { header: "Nama Lengkap*", key: "name", width: 25 },
            { header: "Email*", key: "email", width: 30 },
            { header: "Password*", key: "password", width: 15 },
            { header: "NIP", key: "nip", width: 18 },
            { header: "Telepon", key: "phone", width: 15 },
            { header: "Alamat", key: "address", width: 35 },
            { header: "Role*", key: "role", width: 12 },
            { header: "Divisi", key: "division", width: 20 },
            { header: "Periode*", key: "periode", width: 15 },
            { header: "Sumber Magang*", key: "sumber_magang", width: 15 },
            { header: "Status", key: "is_active", width: 12 },
        ];

        // Style header row
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
        headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF4472C4" },
        };
        headerRow.alignment = { vertical: "middle", horizontal: "center" };
        headerRow.height = 25;

        // Add example rows with various format variations
        worksheet.addRow({
            name: "Budi Santoso",
            email: "budi.santoso@example.com",
            password: "password123",
            nip: "202401001",
            phone: "081234567890",
            address: "Jl. Merdeka No. 123, Jakarta Pusat",
            role: "user",
            division: "IT",
            periode: "2024-01",
            sumber_magang: "kampus",
            is_active: "aktif",
        });

        worksheet.addRow({
            name: "Siti Rahayu",
            email: "siti.rahayu@example.com",
            password: "secure456",
            nip: "202401002",
            phone: "081234567891",
            address: "Jl. Sudirman No. 456, Bandung",
            role: "Supervisor",
            division: "HR",
            periode: "2024-01",
            sumber_magang: "Pemerintah",
            is_active: "1",
        });

        worksheet.addRow({
            name: "Ahmad Wijaya",
            email: "ahmad.wijaya@example.com",
            password: "admin789",
            nip: "",
            phone: "081234567892",
            address: "Jl. Gatot Subroto No. 789, Surabaya",
            role: "Admin",
            division: "",
            periode: "2024-01",
            sumber_magang: "internal",
            is_active: "nonaktif",
        });

        // Add instruction sheet
        const instructionSheet = workbook.addWorksheet("Panduan");
        instructionSheet.columns = [
            { header: "Field", key: "field", width: 25 },
            { header: "Keterangan", key: "description", width: 80 },
        ];

        const instructions = [
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
                field: "Password*",
                description:
                    "Password user (wajib diisi, min 6 karakter). TIPS: Untuk UPDATE user existing, isi 'password123' atau password apapun jika tidak ingin mengubah password lama. Password akan di-hash otomatis untuk user baru",
            },
            {
                field: "NIP",
                description: "Nomor Induk Pegawai (opsional, bisa dikosongkan)",
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
                    "Role user: user, supervisor, atau admin. Fleksibel: bisa 'User', 'SPV', 'Administrator', 'Staff', 'Manager', dll (sistem auto-convert)",
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
                    "Di menu User Management, klik tombol 'Export Excel'. Pilih filter yang diinginkan (periode, role, divisi, dll) untuk mendapatkan data user yang ingin diedit. File Excel akan terdownload dengan data user existing.",
            },
            {
                field: "📝 LANGKAH 2: Edit di Excel",
                description:
                    "Buka file Excel hasil export. Edit data yang ingin diubah LANGSUNG di file tersebut. PENTING: JANGAN ubah kolom Email karena Email adalah identifier untuk update data. Kolom yang bisa diedit: Nama Lengkap, NIP, Telepon, Alamat, Role, Divisi, Periode, Sumber Magang, Status. Simpan file setelah selesai edit.",
            },
            {
                field: "📤 LANGKAH 3: Import Kembali",
                description:
                    "Kembali ke menu User Management, klik tombol 'Import Excel'. Pilih file Excel yang sudah diedit. Sistem akan otomatis mendeteksi email yang sudah ada dan melakukan UPDATE data (bukan INSERT data baru). Tunggu proses selesai dan cek hasilnya.",
            },
            {
                field: "✅ CONTOH KASUS EDIT MASSAL",
                description:
                    "KASUS 1 - Ubah divisi 50 user: Export user periode tertentu → Edit kolom 'Divisi' untuk 50 user sekaligus di Excel → Import kembali. KASUS 2 - Update periode batch: Export user tertentu → Edit kolom 'Periode' ke nilai baru → Import kembali. KASUS 3 - Ubah role beberapa user: Export user → Edit kolom 'Role' dari 'user' ke 'supervisor' → Import kembali. KASUS 4 - Update info kontak: Export user → Edit kolom 'Telepon' dan 'Alamat' → Import kembali.",
            },
            {
                field: "⚠️ HAL PENTING SAAT EDIT",
                description:
                    "1. JANGAN UBAH EMAIL - Email digunakan sebagai unique identifier untuk update. 2. Pastikan format data tetap sama (tidak ada karakter aneh). 3. Nama divisi harus PERSIS dengan yang ada di sistem (case-sensitive). 4. Untuk tidak ubah password existing, isi dengan 'password123' atau password dummy apapun. 5. Field bertanda * tetap WAJIB diisi meski ini adalah update. 6. Backup data sebelum import jika edit dalam jumlah besar.",
            },
            {
                field: "💡 TIPS EFISIENSI",
                description:
                    "1. Gunakan filter Excel untuk mengelompokkan data yang akan diedit. 2. Gunakan Fill Down (Ctrl+D) untuk mengisi nilai yang sama ke banyak cell sekaligus. 3. Gunakan Find & Replace (Ctrl+H) untuk mengganti nilai secara massal. 4. Copy-paste dari Excel lain juga bisa dilakukan (format tetap terjaga). 5. Bisa edit sebagian user saja, tidak harus semua data dalam file export. 6. Hapus baris user yang tidak ingin diedit untuk mempercepat proses import.",
            },
            {
                field: "🔄 ALUR LENGKAP",
                description:
                    "Export (filter periode/divisi) → Buka file Excel → Edit data yang diperlukan (jangan ubah email) → Save file → Import Excel → Sistem deteksi email existing → Update data otomatis → Selesai! Lebih cepat dari edit satu-satu di form.",
            },
            {
                field: "",
                description: "",
            },
            {
                field: "═══ TIPS & CATATAN UMUM ═══",
                description:
                    "✓ Field bertanda * WAJIB diisi | ✓ Email sama = UPDATE data existing | ✓ Email baru = INSERT user baru | ✓ Role, Sumber Magang & Status: case-insensitive & typo-tolerant | ✓ Nama Divisi: exact match atau kosongkan | ✓ Password: untuk update user, isi 'password123' jika tidak ingin ubah password | ✓ NIP, Phone, Address: optional | ✓ Supervisor: set manual di Edit User | ✓ Edit massal: Export → Edit Excel → Import kembali",
            },
        ];

        instructionSheet.addRows(instructions);

        // Style instruction header
        const instHeaderRow = instructionSheet.getRow(1);
        instHeaderRow.font = { bold: true };
        instHeaderRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD9E1F2" },
        };

        // Style section headers with different colors
        const sectionRows = [13, 15, 16, 17, 18, 19, 20, 21, 23];
        sectionRows.forEach((rowNum) => {
            const row = instructionSheet.getRow(rowNum);
            row.font = { bold: true, color: { argb: "FF000000" } };
            row.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFFD966" }, // Light orange for section headers
            };
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
                        attributes: ["id", "name"],
                        required: false,
                    },
                ],
                attributes: [
                    "id",
                    "name",
                    "email",
                    "nip",
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
                    supervisor: "-",
                    is_active: user.is_active ? "Aktif" : "Nonaktif",
                    created_at: formatDate(user.created_at),
                    updated_at: formatDate(user.updated_at),
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

            const worksheet = workbook.getWorksheet("Template Import User");
            if (!worksheet) {
                return {
                    success: false,
                    message:
                        "Sheet 'Template Import User' tidak ditemukan dalam file Excel",
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

            // Skip header row and example rows
            let rowNumber = 1;
            worksheet.eachRow((row, rowIndex) => {
                if (rowIndex <= 1) return; // Skip header

                rowNumber = rowIndex;

                const rawSumberMagang = row
                    .getCell(10)
                    .value?.toString()
                    .trim();
                const normalizedSumberMagang =
                    normalizeSumberMagang(rawSumberMagang);

                const rawRole = row.getCell(7).value?.toString().trim();
                const normalizedRole = normalizeRole(rawRole);

                const rowData = {
                    name: row.getCell(1).value?.toString().trim(),
                    email: row.getCell(2).value?.toString().trim(),
                    password: row.getCell(3).value?.toString().trim(),
                    nip: row.getCell(4).value?.toString().trim(),
                    phone: row.getCell(5).value?.toString().trim(),
                    address: row.getCell(6).value?.toString().trim(),
                    role: normalizedRole,
                    raw_role: rawRole, // Keep original for error messages
                    division: row.getCell(8).value?.toString().trim(),
                    periode: row.getCell(9).value?.toString().trim(),
                    sumber_magang: normalizedSumberMagang,
                    raw_sumber_magang: rawSumberMagang, // Keep original for error messages
                };

                // Skip empty rows
                if (
                    !rowData.name &&
                    !rowData.email &&
                    !rowData.password &&
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

                if (!rowData.password) {
                    rowErrors.push("Password wajib diisi");
                } else if (rowData.password.length < 6) {
                    rowErrors.push("Password minimal 6 karakter");
                }

                if (!rawRole || !rowData.role) {
                    if (!rawRole) {
                        rowErrors.push("Role wajib diisi");
                    } else {
                        rowErrors.push(
                            `Role '${rawRole}' tidak valid. Gunakan: user, supervisor, admin (atau variasi seperti Staff, SPV, Administrator)`
                        );
                    }
                }

                if (!rowData.periode) {
                    rowErrors.push(
                        "Periode/Batch wajib diisi (contoh: 2024-01, Angkatan 15)"
                    );
                }

                if (!rawSumberMagang || !rowData.sumber_magang) {
                    if (!rawSumberMagang) {
                        rowErrors.push("Sumber magang wajib diisi");
                    } else {
                        rowErrors.push(
                            `Sumber magang '${rawSumberMagang}' tidak valid. Gunakan: kampus, pemerintah, swasta, internal, umum (atau variasi seperti Campus, Government, Private)`
                        );
                    }
                }

                // Validate division if provided
                let divisionId = null;
                if (rowData.division) {
                    divisionId = divisionMap.get(
                        rowData.division.toLowerCase()
                    );
                    if (!divisionId) {
                        const availableDivisions = Array.from(
                            divisionMap.keys()
                        ).join(", ");
                        rowErrors.push(
                            `Divisi '${rowData.division}' tidak ditemukan. Divisi tersedia: ${availableDivisions}`
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
                    users.push({
                        name: rowData.name,
                        email: rowData.email,
                        password: rowData.password,
                        nip: rowData.nip || null,
                        phone: rowData.phone || null,
                        address: rowData.address || null,
                        role: rowData.role,
                        division_id: divisionId,
                        periode: rowData.periode,
                        sumber_magang: rowData.sumber_magang,
                        supervisor_id: null,
                        is_active_periode: true,
                        is_active: true,
                    });
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

            // Check for existing emails in database
            const existingEmails = await User.findAll({
                where: {
                    email: users.map((u) => u.email),
                },
                attributes: ["email"],
            });

            if (existingEmails.length > 0) {
                const existingEmailList = existingEmails.map((u) => u.email);
                return {
                    success: false,
                    message: "Ditemukan email yang sudah terdaftar",
                    errors: existingEmailList.map((email) => ({
                        email,
                        errors: ["Email sudah terdaftar dalam sistem"],
                    })),
                };
            }

            // Hash passwords and create users
            const usersToCreate = await Promise.all(
                users.map(async (user) => ({
                    ...user,
                    password: await bcrypt.hash(user.password, 10),
                }))
            );

            const createdUsers = await User.bulkCreate(usersToCreate);

            return {
                success: true,
                message: `Berhasil mengimpor ${createdUsers.length} user`,
                data: {
                    count: createdUsers.length,
                    users: createdUsers.map((u) => ({
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
