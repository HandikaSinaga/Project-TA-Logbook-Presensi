import db from "./database/db.js";

const checkAvatars = async () => {
    try {
        const [results] = await db.query(`
            SELECT id, name, email, role, avatar 
            FROM users 
            WHERE avatar IS NOT NULL 
            LIMIT 10
        `);

        console.log("=== Users with Avatars ===");
        console.table(results);

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

checkAvatars();
