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
//aplicar verificacion de token en todas las rutas
router.use(verifyToken)

router.get('/active', getActiveSubcategories) 

//estadisticas de las subcategorias
router.get('/stats', verifyAdmin, getSubcategoryStats) 

//reordenar subcategorias
router.put('/reorder', verifyAdminOrCoordinador, reorderSubcategories) 


//obtener subcategorias por categoria
router.get('/category/:categoryId', validateObjectId('categoryId'), getSubcategoriesByCategory) 




//listar todas las categorias
router.get('/', getSubcategories) 

//subcategoria por id
router.get('/:id', validateObjectId('id'), getSubcategoryById) 

//crear subcategoria
router.post('/', verifyAdminOrCoordinador, createSubcategory) 

//actualizar subcategoria
router.put('/:id', validateObjectId('id'), verifyAdminOrCoordinador, updateSubcategory) 

//eliminar subcategoria
router.delete('/:id', validateObjectId('id'), verifyAdmin, deleteSubcategory) 

//activar o desactivar subcategoria
router.patch('/:id/toggle-status', validateObjectId('id'), verifyAdminOrCoordinador, toggleSubcategoryStatus)

module.exports = router;