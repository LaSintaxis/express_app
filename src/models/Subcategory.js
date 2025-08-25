const mongoose = require('mongoose')
require('./Category');

const subcategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre de la subcategoria es requerido'],
        trim: true,
        minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
        maxlength: [100, 'El nombre no puede exceder los 100 caracteres'],
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'La descripción no puede tener mas de 500 caracteres :3']
    },
    slug: {
        type: String,
        lowercase: true,
        trim: true,
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

    isActive: {
        type: Boolean,
        default: true
    },
    icon: {
        type: String,
        trim: true
    },
    color: {
        type: String,
        trim: true,
        match: [/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/, 'El color debe ser en codigo Hexadecimal valido']
    },
    sortOrder: {
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
}, {
    timestamps: true
})

subcategorySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});

subcategorySchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() || {};
  if (update.name) {
    update.slug = update.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    this.setUpdate(update);
  }
  next();
});

subcategorySchema.pre('save', async function(next){
    if(this.isModified('category')){
        const Category = mongoose.model('Category');
        const category = await Category.findById(this.category);

        if(!category){
            return next(new Error('La categoria específica no existe'));
        }

        if (!category.isActive){
            return next(new Error('La categoria específica no está activa'))
        }
    }
    next();
})

subcategorySchema.virtual('productsCount', {
    ref:'Product',
    localField: '_id',
    foreignField: 'subcategory',
    count:true
})

subcategorySchema.statics.findByIdCategory = function(categoryId){
    return this.find({
        category: categoryId,
        isActive: true
    })
    .populate('category', 'name slug')
    .sort({ sortOrder: 1, name: 1 });
};

subcategorySchema.statics.findActive = function(){
    return this.find({ isActive: true })
    .populate('category', 'name slug')
    .sort({ sortOrder: 1, name: 1 });
};

subcategorySchema.methods.canBeDeleted = async function () {
    const Product = mongoose.model('Product');
    const productCount = await Product.countDocuments({ subcategory: this._id});
    return productCount === 0;
}

subcategorySchema.methods.getFullPath = async function () {
    await this.populate('category', 'name');
    return `${this.category.name} > ${this.name}`;
}

subcategorySchema.index({category: 1});
subcategorySchema.index({isActive: 1});
subcategorySchema.index({sortOrder: 1});
subcategorySchema.index({slug: 1});
subcategorySchema.index({createdBy: 1});

module.exports = mongoose.model('Subcategory', subcategorySchema)
