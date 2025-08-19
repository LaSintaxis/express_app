const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type:String,
        required: [true, 'El nombre de ususario es requerido'],
        unique: true,
        trim: true,
        minlength: [3, 'El nombre de usuario debe contener al menos 3 caracteres'],
        maxlength: [50, 'El nombre de usuario no puede exceder los 50 caracteres']
    },
    email: {
        type: String,
        required: [true, 'El email es requerido'],
        unique: true,
        trim: true,
        lowercase:true,
        match:[/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,'Por favor ingrese un email válido']// validacion reguex permite verficar que el email es valido
    },
    password: {
        type: String,
        required: [true,'la contraseña es requerida'],
        minlength: [6, 'La contraseña debe contener al menos 6 caracteres']
    },
    firstName: {
        type: String,
        required: [true, 'El nombre es requerido'],
        trim: true,
        maxlength: [50, 'El nombre no puede exceder los 50 caracteres']
    },
    lastName: {
        type: String,
        required: [true, 'El apellido es requerido'],
        trim: true,
        maxlength: [50, 'El apellido no puede contener mas de 50 caracteres']
    },
    role: {
        type: String,
        enum: {
            values: ['admin', 'coordinador'],
            message: 'El rol debe ser admin o coordinador'
        },
        required: [true, 'El rol es requerido']
    },
    isActive: {
        type: Boolean,
        default:true
    },
    phone: {
        type: String,
        trim: true,
        match: [/^[\+]?[1-9][\d\s\-\(\)]{0,20}$/, 'Por favor ingrese un numero de telefono valido']
    },
    lastLogin: {
        type: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
},{
    timestamps:true
});

//Encriptar contraseña antes de guardar
userSchema.pre('save', async function(next){
    if(!this.isModified('password')) return next();
    try{ 
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt)
        next();
    }catch(error){
        next(error);
    }
});

//Si van 
userSchema.pre('findOneAndUpdate', async function(next){
    const update = this.getUpdate();

    if(update.password){
        try{
            const salt = await bcrypt.genSalt(12);
            update.password = await bcrypt.hash(update.password, salt);
        }catch (error) {
            return next(error)
        }
    }
    next();
})

//Metodos para comparar contraseña
userSchema.methods.comparePassword = async function(candidatePassword){
    try{
        return await bcrypt.compare(candidatePassword, this.password);
    }catch(error){
        throw error;
    }
}

// Sobre escribe el metodo toJSON para que nunca envie la contraseña por el frontend
userSchema.methods.toJSON = function() {
    const userObject = this.toJSON();
    delete userObject.password;
    return userObject;
}

userSchema.virtual('fullName').get( function() {
    return `${this.firstName} ${this.lastName}`;
})

//Campo virtual para nombre no se guarda en la base de datos
userSchema.index({role:1});
userSchema.index({isActive:1})

module.exports = mongoose.model('User', userSchema)