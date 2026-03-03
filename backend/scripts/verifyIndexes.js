/**
 * Verify Calendar Performance Indexes
 *
 * This script checks if all required indexes are in place
 * and shows their details.
 *
 * Run: node scripts/verifyIndexes.js
 */

import db from "../database/db.js";
import { QueryTypes } from "sequelize";

async function verifyIndexes() {
    try {
        console.log("\n🔍 Verifying Calendar Performance Indexes...\n");

        const tables = [
            { name: "attendances", indexes: ["idx_attendances_user_date"] },
            {
                name: "leaves",
                indexes: ["idx_leaves_user_dates", "idx_leaves_user_status"],
            },
            { name: "holidays", indexes: ["idx_holidays_date_active"] },
        ];

        let allGood = true;

        for (const table of tables) {
            console.log(`\n📋 Table: ${table.name}`);
            const indexes = await db.query(`SHOW INDEX FROM ${table.name};`, {
                type: QueryTypes.SELECT,
            });

            for (const expectedIndex of table.indexes) {
                const found = indexes.find(
                    (idx) => idx.Key_name === expectedIndex,
                );
                if (found) {
                    console.log(`   ✅ ${expectedIndex} - EXISTS`);
                } else {
                    console.log(`   ❌ ${expectedIndex} - MISSING`);
                    allGood = false;
                }
            }
        }

        console.log("\n" + "=".repeat(50));
        if (allGood) {
            console.log("✅ All indexes are in place!");
            console.log("🚀 Your calendar queries are now optimized!\n");
        } else {
            console.log("⚠️  Some indexes are missing!");
            console.log("Run: node scripts/runCalendarIndexesMigration.js\n");
        }

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Error verifying indexes:", error);
        process.exit(1);
    }
}

verifyIndexes();
