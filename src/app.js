require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const { errorHandler, notFound } = require('./middlewares/errorHandler')

const apiRoutes = require('./routes')

const app = express()

app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'exp://0.0.0.0:8081',
        'exp://0.0.0.0:8082',
        'exp://0.0.0.0:8083',//si algo cambiar por la ip del equipo OJO
        'http://0.0.0.0:8081',
        'http://0.0.0.0:8082',
        'http://0.0.0.0:8083',
        'http://localhost:8081',
        'http://localhost:8082',
        'http://localhost:8083',
    ],
    credentials: true
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

if (process.env.NODE_EMV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
        next();
    })
}

//configuracion de rutas
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    console.log('GET / peticion recibida desde ', req.ip)
    res.status(200).json({
        success: true,
        message: 'Servidor del API de gestion de productos',
        version: '1.0.0',
        status: 'running',
        timestamps: new Date,
        clientIP: req.ip
    })
})

app.use(notFound)
app.use(errorHandler)

//conexion con la base de datos
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB conectado: ${conn.connection.host}`);
    } catch (error) {
        //si la conexion falla
        console.error('[/src/app.js] Error conectando a mongoDB', error.message);
        process.exit(1)
    }
}

//iniciando servidor
const PORT = process.env.PORT || 5000
const startServer = async () => {
    try {
        await connectDB();
        const HOST = process.env.HOST || '0.0.0.0';
        app.listen(PORT, HOST, () => {
            console.log(`SERVIDOR INICIADO 
                puerto: ${PORT.toString().padEnd(49)} ||
                Modo: ${(process.env.NODE_ENV || 'development').padEnd(51)} ||
                URL Local: http://localhost:${PORT.toString().padEnd(37)} ||
                URL Red: http://${HOST} : ${PORT.toString().padEnd(37)} || 
                Endpoints disponibles: 
                * Get/ - informacion del servidor
                * Get /api - Info de api
                * Post /api/auth/login - Login
                * Get /api/users - Gestion de usuarios
                * Get /api/categories - gestion de categorias
                * Get /api/subcategories - Gestion de subcategorias
                * Get /api/products - Gestion de productos
                DOCUMENTACION DE POSTMAN `)
        })
    } catch (error) {
        console.error('[/src/app.js] Error iniciando el servidor: ', error.message)
    }
}
process.on('uncaughtException', (err) => {
    console.error('|Uncaught Exception', err.message);
    process.exit(1);
})

//inicia el servidor
startServer();

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection', err.message);
    process.exit(1);
})

process.on('SIGTERM', () => {
    console.log('SIGTERM recibido. Cerrando serevidor gracefull...');
    mongoose.connection.close(() => {
        console.log('Conexion a mongoDb cerrada')
        process.exit(0)
    })
})
module.exports = app; 