const express = require('express');
const router = express.Router()

const {
    getCategories,
    getActiveCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    reorderCategories,
    getCategoryStats
}  = require('../controllers/categoryController')

//middlewares de autentcacion y autorizacion
const {
    verifyToken,
    verifyAdmin,
    verifyAdminOrCoordinador
} = require('../middlewares/auth')

//Middleware de autenticacion
const { validateObjectId } = require('../middlewares/errorHandler')

//categorias activas para frontend publico
router.get('/active',verifyToken, getActiveCategories)

//aplicar verificacion de token en todas las rutas
router.use(verifyToken)

//estadisticas de las categorias
router.get('/stats', verifyAdmin, getCategoryStats)

//reordenar categorias
router.put('/reorder', verifyAdminOrCoordinador, reorderCategories)

//listar todas las categorias
router.get('/', getCategories)

//categoria por id
router.get('/:id', validateObjectId('id'), verifyAdminOrCoordinador, getCategoryById)

//crear categoria
router.post('/', verifyAdminOrCoordinador, createCategory)

//actualizar categoria
router.put('/:id', validateObjectId('id'), verifyAdminOrCoordinador, updateCategory)

//eliminar categoria
router.delete('/:id', validateObjectId('id'), verifyAdmin, deleteCategory)

//activar o desactivar categoria
router.patch('/:id/toggle-status', validateObjectId('id'), verifyAdminOrCoordinador, toggleCategoryStatus)

module.exports = router;