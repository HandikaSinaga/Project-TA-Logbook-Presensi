import jwt from 'jsonwebtoken';
import models from '../models/index.js';

const { User } = models;

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header or cookies
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token, access denied'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is expired
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return res.status(401).json({
        success: false,
        message: 'Token expired, please login again'
      });
    }

    // ──────────────────────────────────────────────────────────────
    // DB check: pastikan user masih aktif (is_active = true)
    // Ini menangkap kasus akun dinonaktifkan setelah JWT diterbitkan
    // ──────────────────────────────────────────────────────────────
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'email', 'role', 'is_active', 'division_id'],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Akun tidak ditemukan'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda telah dinonaktifkan. Hubungi administrator untuk informasi lebih lanjut.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Attach user to request (gunakan data DB yang fresh, bukan payload JWT lama)
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      division_id: user.division_id,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

export default authMiddleware;
