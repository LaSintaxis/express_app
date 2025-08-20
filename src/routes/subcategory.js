const express = require('express');
const router = express.Router()

const {
    getSubcategories,
    getSubcategoriesByCategory,
    getActiveSubcategories,
    getSubcategoryById,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    toggleSubcategoryStatus,
    reorderSubcategories,
    getSubcategoryStats
}  = require('../controllers/subcategoryController')

//middlewares de autentcacion y autorizacion
const {
    verifyToken,
    verifyAdmin,
    verifyAdminOrCoordinador
} = require('../middlewares/auth')

//Middleware de autenticacion
const { validateObjectId } = require('../middlewares/errorHandler')

router.get('/active', getActiveSubcategories)

//categorias activas para frontend publico
router.get('/category/:categoryId', validateObjectId('categoryId'), getSubcategoriesByCategory)

//aplicar verificacion de token en todas las rutas
router.use(verifyToken)

//estadisticas de las categorias
router.get('/stats', verifyAdmin, getSubcategoryStats)

//reordenar subcategorias
router.get('/reorder', verifyAdminOrCoordinador, reorderSubcategories)

//listar todas las categorias
router.get('/', getSubcategories)

//subcategoria por id
router.get('/id', validateObjectId('id'), getSubcategoryById)

//crear subcategoria
router.post('/', verifyAdminOrCoordinador, createSubcategory)

//actualizar subcategoria
router.put('/:id', validateObjectId('id'), verifyAdminOrCoordinador, updateSubcategory)

//eliminar categoria
router.delete('/:id', validateObjectId('id'), verifyAdmin, deleteSubcategory)

//activar o desactivar subcategoria
router.patch('/:id/toggle-status', validateObjectId('id'), verifyAdminOrCoordinador, toggleSubcategoryStatus)

module.exports = router;