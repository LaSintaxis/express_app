const express = require('express');
const router = express.Router()

const {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    getUserStats
}  = require('../controllers/UserController')

//middlewares de autentcacion y autorizacion
const {
    verifyToken,
    verifyAdmin,
    verifyAdminOrOwner
} = require('../middlewares/auth')

//Middleware de autenticacion
const { validateObjectId } = require('../middlewares/errorHandler')

//aplicar verificacion de token en todas las rutas
router.use(verifyToken)

//estadisticas de los usuarios
router.get('/stats', verifyAdmin, getUserStats)

//listar todos los usuarios
router.get('/', verifyAdmin, getUsers)

//usuario por id
router.get('/id', validateObjectId('id'), verifyAdminOrOwner, getUserById)

//crear usuario
router.post('/', verifyAdmin, createUser)

//actualizar usuario
router.put('/:id', validateObjectId('id'), verifyAdminOrOwner, updateUser)

//eliminar usuario
router.delete('/:id', validateObjectId('id'), verifyAdmin, deleteUser)

//activar o desactivar usuario
router.patch('/:id/toggle-status', validateObjectId('id'), verifyAdmin, toggleUserStatus)

module.exports = router;