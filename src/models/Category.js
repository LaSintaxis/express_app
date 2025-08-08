const mongoose = require('mongoose');

const categoryShema = new mongoose.Schema({
    name:{
        type: String,
        required: [true, 'El nombre de categoria es requerido'],
        trim: true,
        unique: true,
        minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
        maxlength: [100, 'El nombre no puede exceder los 100 caracteres']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'La descripcion no puede exceder loss 500 caracteres']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    isActive:{
        type: Boolean,
        default: true
    },
    icon: {
        type:String,
        trim: true
    },
    color:{
        type: String,
        trim: true,
        match: [/^#(A-FA-F0-9{6}|[A-Fa-F0-9]{3})$/, 'El color debe ser en codigo Hexadecimal valido']
    },
    sortOrder:{
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
},{
    timestamps: true
})

categoryShema.pre('save', function (next){
    if (this.isModified('name')) {
        this.slug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }
    next();
})

categoryShema.pre('findOneAndUpdate', function(next){
    const update = this.getUpdate();

    if(update.name){
        update.slug = update.name
        .toLowerCase()
        .replace(/(^-|-$)+/g, '');
    }
    next();
})