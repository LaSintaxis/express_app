require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const { errorHandler, notFound } = require('./middlewares/errorHandler')

const apiRoutes = require('./routes')

const app = express()

app.use( cors( {
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