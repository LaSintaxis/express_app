const jwt = require('jsonwebtoken')
const { User } = require('../models')

const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Token de acceso requerido'
            });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Formato de token inválido'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.userId) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido (no contiene userId)'
            });
        }

        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Usuario inactivo'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('[middlewares/auth.js] Error en verifyToken:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Token inválido' });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expirado' });
        }

        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};


const verifyRole = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                })
            }

            if (!allowedRoles.includes( req.user.role )) {
                return res.status(403).json({
                    success: false,
                    message: 'no tienes permisos para realizar esta acción'
                })
            }

            next()
        } catch (error) {
            console.error('[middlewares/auth] Error en verifyRole: ', error)
            return res.status(500).json({
                success: false,
                message: '[middlewares/auth] Error interno en el servidor'
            })
        }
    }
}

const verifyAdmin = verifyRole('admin');
const verifyAdminOrCoordinador = verifyRole('admin', 'coordinador')

const verifyAdminOrOwner = async (req, res, next ) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            })
        }

        if (req.user.role === 'admin') {
            return next()
        }

        const targetUserId = req.params.id || req.params.userId

        if (req.user._id.toString() !== targetUserId) {
            return res.status(403).json({
                success: false,
                message: 'Solo puedes modificar tu propio perfil'
            })
        }

        next()
    } catch (error) {
        console.error('[middlewares/auth] Error en verifyAdminOrOwner: ', error)
        return res.status(500).json({
            success: false,
            message:'[middlewares/auth] Error interno del servidor'
        })
    }
}

module.exports = {
    verifyToken,
    verifyRole,
    verifyAdmin,
    verifyAdminOrOwner,
    verifyAdminOrCoordinador
}