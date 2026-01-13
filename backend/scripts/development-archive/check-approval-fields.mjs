import mysql from "mysql2/promise";

const checkApprovalFields = async () => {
    const conn = await mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "db_presensi_ta",
    });

    try {
        const [rows] = await conn.query("DESC attendances");

        const approvalFields = [
            "approved_by",
            "approved_at",
            "rejected_by",
            "rejected_at",
            "rejection_reason",
            "approval_status",
        ];

        console.log("\n📋 APPROVAL FIELDS STATUS:\n");

        approvalFields.forEach((fieldName) => {
            const field = rows.find((r) => r.Field === fieldName);
            if (field) {
                console.log(
                    `✅ ${fieldName.padEnd(20)} : ${field.Type.substring(
                        0,
                        35
                    ).padEnd(35)} | Default: ${field.Default || "null"}`
                );
            } else {
                console.log(`❌ ${fieldName.padEnd(20)} : MISSING`);
            }
        });

        const foundCount = approvalFields.filter((f) =>
            rows.some((r) => r.Field === f)
        ).length;
        console.log(`\nTotal: ${foundCount}/6 fields present`);
    } finally {
        await conn.end();
    }
};

checkApprovalFields();
