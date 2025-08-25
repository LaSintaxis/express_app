const express = require('express')
const router = express.Router()

//importar controladores de autenticacion
const {
    login,
    getMe,
    changePassword,
    logout,
    verifyToken
} = require('../controllers/AuthController')

//importar middlewares
const { verifyToken: authMiddleware } = require('../middlewares/auth')

//ruta login publica
router.post('/login', login)

//ruta obtener datos de usuario actual privada
router.get('/me', authMiddleware, getMe)

//ruta para cambiar la contraseña
router.put('/change-password', authMiddleware, changePassword)

//ruta pata cessar sesion
router.post('/logout', authMiddleware, logout)

//ruta para verificar token 
router.get('/verify', authMiddleware, verifyToken)

module.exports = router;