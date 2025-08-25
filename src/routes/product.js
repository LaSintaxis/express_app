const express = require('express');
const router = express.Router()

const {
    getProducts,
    getActiveProducts,
    getProductsByCategory,
    getProductsBySubcategory,
    getFeacturedProducts,
    getProductById,
    getProductBySku,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    updateProductStock,
    getProductStats
}  = require('../controllers/productController')

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

router.get('/active', getActiveProducts)

//productos destacados
router.get('/feactured', getFeacturedProducts)

//productos por categorias activas para frontend publico
router.get('/category/:categoryId', validateObjectId('categoryId'), getProductsByCategory)

//productos por subcategorias activas para frontend publico
router.get('/subcategory/:subcategoryId', validateObjectId('subcategoryId'), getProductsBySubcategory)


//estadisticas de los productos
router.get('/stats', verifyAdmin, getProductStats)

//obtener producto por sku
router.get('/sku/:sku', getProductBySku)

//listar todas los productos
router.get('/', getProducts)

//productos por id
router.get('/:id', validateObjectId('id'), getProductById)

//crear producto
router.post('/', verifyAdminOrCoordinador, createProduct)

//actualizar producto
router.put('/:id', validateObjectId('id'), verifyAdminOrCoordinador, updateProduct)

//eliminar producto
router.delete('/:id', validateObjectId('id'), verifyAdmin, deleteProduct)

//activar o desactivar producto
router.patch('/:id/toggle-status', validateObjectId('id'), verifyAdminOrCoordinador, toggleProductStatus)

//actualizar producto por stock
router.patch('/:id/stock', validateObjectId('id'), verifyAdminOrCoordinador, updateProductStock)

module.exports = router;