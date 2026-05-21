/**
 * Cleanup Script: Hapus file upload yang tidak sesuai struktur baru
 * dan tidak direferensikan di database.
 *
 * Struktur baru yang valid:
 *   attendance/periode-{batch}/{year}/{month}/div-{id}/user-*.{ext}
 *   logbook/periode-{batch}/{year}/{month}/div-{id}/user-*.{ext}
 *   leave/periode-{batch}/{year}/{month}/div-{id}/user-*.{ext}
 *   avatars/div-{id}/user-*.{ext}
 *   avatars/no-division/user-*.{ext}
 *
 * Jalankan: node scripts/cleanupUploads.js [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize, Op } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_ROOT = path.join(__dirname, '..', 'public', 'uploads');
const DRY_RUN = process.argv.includes('--dry-run');

// ─── Database setup ───────────────────────────────────────────────────────────
import models from '../models/index.js';
const { Attendance, User, Leave, Logbook } = models;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Collect all files recursively from a directory
 */
function getAllFiles(dirPath, result = []) {
    if (!fs.existsSync(dirPath)) return result;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            getAllFiles(fullPath, result);
        } else if (entry.name !== '.gitkeep') {
            result.push(fullPath);
        }
    }
    return result;
}

/**
 * Convert absolute file path to URL-style path stored in DB
 * e.g. C:\...\public\uploads\avatars\... → /uploads/avatars/...
 */
function toUrlPath(absolutePath) {
    return absolutePath
        .replace(/\\/g, '/')
        .replace(/^.*\/public/, '')
        .replace(/^\//, '');
}

/**
 * Check if a file path matches the new storage structure
 */
function matchesNewStructure(urlPath) {
    // avatars/div-{id}/... or avatars/no-division/...
    if (/^uploads\/avatars\/(div-\d+|no-division)\//.test(urlPath)) return true;
    // {type}/periode-{batch}/{year}/{month}/div-{id}/...
    if (/^uploads\/(attendance|logbook|leave)\/periode-[^/]+\/\d{4}\/\d{2}\/(div-\d+|no-division)\//.test(urlPath)) return true;
    return false;
}

/**
 * Remove empty directories recursively
 */
function removeEmptyDirs(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    const entries = fs.readdirSync(dirPath);
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry);
        if (fs.statSync(fullPath).isDirectory()) {
            removeEmptyDirs(fullPath);
        }
    }
    const remaining = fs.readdirSync(dirPath);
    if (remaining.length === 0 && dirPath !== UPLOADS_ROOT) {
        fs.rmdirSync(dirPath);
        console.log(`  [DIR REMOVED] ${dirPath}`);
    }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('='.repeat(70));
    console.log(`CLEANUP SCRIPT — Upload Storage`);
    console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (tidak ada yang dihapus)' : '🗑️  LIVE DELETE'}`);
    console.log('='.repeat(70));

    // 1. Collect semua file yang ada di disk
    const allFiles = getAllFiles(UPLOADS_ROOT);
    console.log(`\nTotal file ditemukan: ${allFiles.length}`);

    // 2. Ambil semua path yang direferensikan di DB
    const [attendances, users, logbooks] = await Promise.all([
        Attendance.findAll({
            attributes: ['check_in_photo', 'check_out_photo'],
            where: {
                [Op.or]: [
                    { check_in_photo: { [Op.ne]: null } },
                    { check_out_photo: { [Op.ne]: null } },
                ]
            },
            raw: true,
        }),
        User.findAll({
            attributes: ['avatar'],
            where: { avatar: { [Op.ne]: null } },
            raw: true,
        }),
        Logbook.findAll({
            attributes: ['attachments'],
            where: { attachments: { [Op.ne]: null } },
            raw: true,
        }),
    ]);

    // Bangun set path DB (normalisasi ke forward slash)
    const dbPaths = new Set();
    attendances.forEach(a => {
        if (a.check_in_photo) dbPaths.add(a.check_in_photo.replace(/\\/g, '/').replace(/^\//, ''));
        if (a.check_out_photo) dbPaths.add(a.check_out_photo.replace(/\\/g, '/').replace(/^\//, ''));
    });
    users.forEach(u => {
        if (u.avatar) dbPaths.add(u.avatar.replace(/\\/g, '/').replace(/^\//, ''));
    });
    logbooks.forEach(l => {
        // attachments is a JSON array of URLs
        try {
            const attachments = typeof l.attachments === 'string'
                ? JSON.parse(l.attachments)
                : (l.attachments || []);
            if (Array.isArray(attachments)) {
                attachments.forEach(url => {
                    if (url) dbPaths.add(url.replace(/\\/g, '/').replace(/^\//, ''));
                });
            }
        } catch (e) {
            // ignore parse error
        }
    });

    console.log(`Path direferensikan di DB: ${dbPaths.size}`);

    // 3. Kategorikan setiap file
    const toDelete = [];
    const toKeep = [];
    const referencedButOldStructure = [];

    for (const filePath of allFiles) {
        const urlPath = toUrlPath(filePath);

        // Check DB reference (coba beberapa format)
        const inDb = dbPaths.has(urlPath) ||
            dbPaths.has('/' + urlPath) ||
            dbPaths.has(urlPath.replace('uploads/', '/uploads/'));

        const conformsToNewStructure = matchesNewStructure(urlPath);

        if (inDb && !conformsToNewStructure) {
            // Direferensikan tapi format lama — simpan, tandai untuk migrasi
            referencedButOldStructure.push({ filePath, urlPath });
            toKeep.push(filePath);
        } else if (inDb) {
            // Direferensikan dan sesuai struktur baru — simpan
            toKeep.push(filePath);
        } else {
            // TIDAK direferensikan DI DB — kandidat hapus
            toDelete.push({ filePath, urlPath, conformsToNewStructure });
        }
    }

    // 4. Tampilkan hasil analisis
    console.log('\n' + '─'.repeat(70));
    console.log(`✅ File disimpan (ada di DB): ${toKeep.length}`);

    if (referencedButOldStructure.length > 0) {
        console.log(`\n⚠️  File dengan struktur LAMA tapi masih direferensikan DB (${referencedButOldStructure.length}):`);
        referencedButOldStructure.forEach(({ urlPath }) => {
            console.log(`   KEEP (old-format): ${urlPath}`);
        });
        console.log('   → File ini TIDAK dihapus. Perlu migrasi manual jika ingin dirapikan.');
    }

    console.log(`\n🗑️  File untuk dihapus (tidak ada di DB): ${toDelete.length}`);
    toDelete.forEach(({ urlPath }) => {
        console.log(`   DELETE: ${urlPath}`);
    });

    if (toDelete.length === 0) {
        console.log('\n✨ Tidak ada file yang perlu dihapus.');
        process.exit(0);
    }

    // 5. Hapus (jika bukan dry run)
    console.log('\n' + '─'.repeat(70));
    if (DRY_RUN) {
        console.log('🔍 DRY RUN selesai. Jalankan tanpa --dry-run untuk menghapus.');
    } else {
        let deletedCount = 0;
        let deletedSize = 0;

        for (const { filePath } of toDelete) {
            try {
                const stat = fs.statSync(filePath);
                deletedSize += stat.size;
                fs.unlinkSync(filePath);
                deletedCount++;
                console.log(`  ✓ Deleted: ${filePath}`);
            } catch (err) {
                console.error(`  ✗ Failed: ${filePath} — ${err.message}`);
            }
        }

        // Bersihkan folder kosong
        console.log('\nMembersihkan folder kosong...');
        removeEmptyDirs(UPLOADS_ROOT);

        console.log('\n' + '='.repeat(70));
        console.log(`✅ Selesai! Dihapus: ${deletedCount} file (${(deletedSize / 1024 / 1024).toFixed(2)} MB)`);
    }

    process.exit(0);
}

main().catch(err => {
    console.error('Script error:', err);
    process.exit(1);
});
