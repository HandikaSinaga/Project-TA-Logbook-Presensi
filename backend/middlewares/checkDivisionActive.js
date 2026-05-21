import models from '../models/index.js';

const { Division } = models;

/**
 * Middleware: Pastikan divisi user masih aktif sebelum melanjutkan operasi tulis
 * (check-in, logbook, leave request, dsb.)
 *
 * Jika divisi tidak aktif → tolak dengan 403 dan pesan yang informatif.
 * Jika user tidak punya divisi → pass through (biarkan controller handle).
 */
const checkDivisionActive = async (req, res, next) => {
    try {
        const user = req.user;

        // Jika user tidak punya division_id, lewati (controller yg handle)
        if (!user.division_id) {
            return next();
        }

        const division = await Division.findByPk(user.division_id, {
            attributes: ['id', 'name', 'is_active', 'is_active_periode'],
        });

        if (!division) {
            return next(); // Divisi tidak ditemukan, biarkan controller handle
        }

        if (!division.is_active) {
            return res.status(403).json({
                success: false,
                message: `Divisi "${division.name}" sedang dinonaktifkan. Pengambilan data presensi, logbook, dan perizinan ditangguhkan. Hubungi administrator.`,
                code: 'DIVISION_DEACTIVATED',
                division: {
                    id: division.id,
                    name: division.name,
                    is_active: division.is_active,
                },
            });
        }

        if (!division.is_active_periode) {
            return res.status(403).json({
                success: false,
                message: `Periode divisi "${division.name}" telah berakhir. Tidak dapat melakukan pengisian data baru.`,
                code: 'DIVISION_PERIODE_ENDED',
                division: {
                    id: division.id,
                    name: division.name,
                    is_active_periode: division.is_active_periode,
                },
            });
        }

        next();
    } catch (error) {
        console.error('[checkDivisionActive] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal memverifikasi status divisi',
        });
    }
};

export default checkDivisionActive;
