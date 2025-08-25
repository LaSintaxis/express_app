const bcrypt = require('bcryptjs');
const { User } = require('../models')
const { generateToken } = require('../utils/jwt')
const { asyncHandler } = require('../middlewares/errorHandler')

//Login de usuario
const login = asyncHandler(async (req, res) => {
    console.log('DEBUG: Datos recibidos en login ', req.body)
    const { email, username, password } = req.body;
    const loginField = email || username;
    console.log('DEBUG: Campo de login ', loginField);
    console.log('DEBUG: Password recibido ', password ? '[PRESENTE]' : '[AUSENTE]');
    //Validacion de campos requeridos
    if (!loginField || !password) {
        console.log('Error: faltan credenciales')
        return res.status(400).json({
            success: false,
            message: 'Username y contraseña son requeridos'
        })
    }
    //busqueda de usuario en la base de datos
    try {
        console.log('DEBUG: buscando usuario con ', loginField.toLowerCase());
        const user = await User.findOne({
            $or: [
                { username: loginField.toLowerCase() },
                { email: loginField.toLowerCase() }
            ]
        }).select('+password');
        console.log('DEBUG: usuario encontrado ', user ? user.username : 'NINGUNO');
        if (!user) {
            console.log('ERROR - Usuario no encontrado')
            return res.status(404).json({
                success: false,
                message: 'Credenciales inválidas'
            })
        }
        //validacion usuario inactivo
        if(!user.isActive) {
            console.log('ERROR - Usuario inactivo');
            return res.status(401).json({
                success: false,
                message: 'Usuario inactivo, contacta al administrador'
            })
        }
        // validacion de contraseña
        console.log('DEBUG: verificando contraseña');
        const isPasswordValid = await user.comparePassword(password);
        console.log('DEBUG: contraseña valida', isPasswordValid);
        if (!isPasswordValid) {
            console.log('Error - comtraseña invalida');
            return res.status(401).json({
                success: false,
                message: 'Credenciales invalidas'
            })
        }
        user.lastLogin = new Date();
        await user.save()
        //generar token JWT
        const token = generateToken(user._id);
        const { password: _, ...userResponse } = user.toObject();
        res.status(200).json({
            success: true,
            message: 'login exitoso',
            data: {
                user: userResponse,
                token,
                expiresIn: process.env.JWT_EXPIRE || '1h'
            }
        })
    }catch(error){
        console.log('ERROR en login ', error)
        res.status(500).json({
            success: false,
            message: '[controllers/AuthController.js] Error interno del servidor'
        })
    }
})

//obtener informacion del usuario autenticado
const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    res.status(200).json({
        success: true,
        data: user
    })
})

//cambio de contraseña
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(401).json({
            success: false,
            message: 'contraseña actual y nueva contraseña son requeridas'
        })
    }
    if ( newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'La nueva contraseña debe tener al menos 6 caracteres'
        })
    }
    //obtener usuario con contraseña actual
    const user = await User.findById(req.user._id).select('+password')
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if(!isCurrentPasswordValid) {
        return res.status(400).json({
            success: false,
            message: 'la contraseña actual es incorrecta'
        })
    }
    user.password = newPassword;
    await user.save();
    res.status(200).json({
        success: true,
        message: 'contraseña actualizada exitosamente'
    })
})
//invalidar token de usuario extraño
const logout = asyncHandler(async (req, res) => {
    res.status(200).json({
        success:true,
        message: 'logout exitoso, invalida el token en el cliente'
    })
})
//verificar token
const verifyToken = asyncHandler( async (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Token valido',
        data: req.user
    })
})

module.exports = {
    login,
    getMe,
    changePassword,
    logout,
    verifyToken
}
