import mysql from "mysql2/promise";

const addApprovedByField = async () => {
    const conn = await mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "db_presensi_ta",
    });

    try {
        // Add approved_by column
        await conn.query(
            'ALTER TABLE attendances ADD COLUMN approved_by INT NULL COMMENT "ID supervisor yang menyetujui" AFTER notes'
        );
        console.log("✅ approved_by field added");

        // Add foreign key
        await conn.query(
            "ALTER TABLE attendances ADD CONSTRAINT fk_attendances_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE"
        );
        console.log("✅ Foreign key constraint added");

        console.log("\n✅ All approval fields now complete!");
    } catch (e) {
        if (e.code === "ER_DUP_FIELDNAME") {
            console.log("⚠️  Field already exists");
        } else if (e.code === "ER_DUP_KEYNAME") {
            console.log("⚠️  Foreign key already exists");
        } else {
            console.error("❌ Error:", e.message);
        }
    } finally {
        await conn.end();
    }
};

addApprovedByField();
