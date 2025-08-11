const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    name: {
        trype: String,
        required: [true, 'El nombre del producto es requerido'],
        trim: true,
        minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
        maxlength: [100, 'El nombre no puede exceder los 100 caracteres'],
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'La descripción no puede tener mas de 1000 caracteres >:v']
    },
    shortDescription: {
        type: String,
        trim: true,
        maxlength: [250, 'La descripción no puede tener mas de 250 caracteres :o']
    },
    slug: {
        type: String,
        lowercase: true,
        trim: true,
    },

    sku: {
        type: String,
        required: [true, 'El SKU es requerido'],
        unique: true,
        uppercase: true,
        minlength: [3, 'El SKU debe tener al menos 3 caracteres'],
        maxlength: [50, 'EL SKU no puede exceder 50 caracteress']
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'La categoria es requerida'],
        ref: 'Category',
        validate: {
            validator: async function (categoryId) {
                const Category = mongoose.model('Category')
                const category = await Category.findById(categoryId);
                return category && category.isActive;
            },
            message: 'La categoria debe existir y estar activa'
        }
    },
    subcategory: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'La subcategoria es requerida'],
        ref: 'Subcategory',
        validate: {
            validator: async function (subcategoryId) {
                const Subcategory = mongoose.model('Subcategory')
                const subcategory = await Subcategory.findById(subcategoryId);
                return subcategory && subcategory.isActive;
            },
            message: 'La subcategoria debe existir y estar activa'
        }
    },
    price: {
        type: Number,
        required: [true, 'El precio es requerido'],
        min: [0, 'El precio no puede ser negativo'],
        validate: {
            validator: function (value) {
                return Number.isFinite(value) && value >= 0;
            },
            message: 'El precio debe ser un numero valido mayor o igual a 0'
        }
    },
    comparePrice: {
        type: Number,
        min: [0, 'El precio de comparacion no puede ser negativo'],
        validate: {
            validator: function (value) {
                if (value == null || value === undefined)
                    return true;
                return Number.isFinite(value) && value >= 0
            },
            message: 'El precio de comparacion debe ser un numero valido mayor o igual a 0'
        }
    },
    cost: {
        type: Number,
        min: [0, 'El costo no puede ser negativo'],
        validate: {
            validator: function (value) {
                if (value === null || value === undefined)
                    return true;
                return Number.isFinite(value) && value >= 0;
            },
            message: 'El costo debe ser un numero valido mayor o igual a 0'
        }
    },
    stock: {
        quantity: {
            type: Number,
            default: 0,
            min: [0, 'La cantidad de stock no puede ser negativa']
        }
    },
    minStock: {
        type: Number,
        default: 0,
        min: [0, 'El stock minimo no puede ser negativo']
    },
    trackStock: {
        type: Boolean,
        default: true
    },
    dimensions: {
        weigth: {
            type: Number,
            min: [0, 'La']
        },
        height: {
            type: Number,
            min: [0, 'La altura no puede ser negativa']
        },
        length: {
            type: Number,
            min: [0, 'La longitud no puede ser negativa']
        },
        width: {
            type: Number,
            min: [0, 'El ancho no puede ser negativo']
        },
        images: [{
            url: {
                type: String,
                required: true,
                trim: true
            },
            alt: {
                type: String,
                trim: true,
                maxlength: [200, 'El texto alternativo no puede exceder los 200 caracteres']
            },
            isPrimary: {
                type: Boolean,
                default: false
            }
        }],
        tags: [{
            type: String,
            trim: true,
            lowercase: true,
            maxlength: [50, 'Cada tag no puede exceder 50 caracteres']
        }],
        isActive: {
            type: Boolean,
            default: true
        },
        isFeactured: {
            type: Boolean,
            default: false
        },
        isDigital: {
            type: Boolean,
            default: false
        },
        sortOrder: {
            type: Number,
            trim: true,
            maxlength: [70, 'El titulo no puede exceder los 70 caracteres']
        },
        seoDescription: {
            type: String,
            trim: true,
            maxlength: [160, 'La descripcion no puede superar los 160 caracteres']
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

    }, {
        timestamps: true
    }
})

productSchema.pre('save', function(next){
    if(this.isModified('name')){
        this.slug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    }
    next();
})

productSchema.pre('findOneAndUpdate', function(next){
    const update = this.getUpdate();

    if(update.name){
        update.slug = update.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }
    next();
})