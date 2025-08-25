//archivo principal de rutas
//centraliza las rutas y organiza todas las rutas del api

const express = require('express')
const router = express.Router()

//Importa las rutas modulares
const authRoutes = require('./auth')
const userRoutes = require('./user')
const categoryRoutes = require('./category')
const subcategoryRoutes = require('./subcategory')
const productRoutes = require('./product')

//cada modulo tiene su propio espacio de nombre en la url
router.use('/auth', authRoutes)
router.use('/user', userRoutes)
router.use('/categories', categoryRoutes)
router.use('/subcategories', subcategoryRoutes)
router.use('/products', productRoutes)

//permite verificar que el 
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Api funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    })
})

//proporciona documentacion basica sobre la api
router.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Bienvenido a la API de gestion de productos',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            categories: '/api/categories',
            subcategories: '/api/subcategories',
            products: '/api/products'
        },
        documentation: {
            postman: 'Importe la coleccion de Postman para probar todos los endpoints',
            authentication: 'usa /api/auth/login para obtener el token JWT'
        }
    })
})

module.exports = router