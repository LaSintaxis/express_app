const errorHandler = (err, req, res, next) => {
    console.error('Error Stack', err.stack)

    //
    if(err.name === 'ValidateError') {
        const errors = Object.values(err.errors).map(e => message)
        return res.status(400).json({
            success: false,
            message: 'error de validacion',
            errors
        })
    }

    //error de duplicado
    if (err.code == 11000) {
        const field = Object.keys(err.keyPattern)[0]
        return res.status(400).json({
            success: false,
            message: `${field} ya existe en el sistema`
        })
    }

    //Error de cast objectId
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'ID invalido'
        })
    }

    //Error jwt
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success:false,
            message: 'Token inválido'
        })
    }

    if(err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token Expirado'
        })
    }

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor'
    })
}

//middleware para rutas encontradas
const notFound = (req, res, next) => {
    const error = new Error(`[middlewares/errorHandler] Ruta no encontrada - ${req.originalUrl}`)
    res.status(400)
    next(error);
}

//middleware para validar ObjectId
const validateObjectId = (paramName = 'id') => {
    return (req, res, next) => {
        const mongoose = require('mongoose')
        const id =req.params[paramName]

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido'
            })
        }
        next()
    }
}

//middleware para capturar errores asincrónicos
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn (req, res, next )).catch(next)
} 

module.exports = {
    errorHandler,
    notFound,
    validateObjectId,
    asyncHandler
}