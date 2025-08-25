const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
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
        maxlength: [500, 'La descripcion no puede exceder los 500 caracteres']
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
        match: [/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/, 'El color debe ser en codigo Hexadecimal valido']
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

categorySchema.pre('save', function (next){
    if (this.isModified('name')) {
        this.slug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }
    next();
})

categorySchema.pre('findOneAndUpdate', function(next){
    const update = this.getUpdate();

    if(update.name){
        update.slug = update.name
        .toLowerCase()
        .replace(/(^-|-$)+/g, '');
    }
    next();
})

categorySchema.virtual('subcategoriesCount', {
    ref: 'Subcategory',
    localField: '_id',
    foreignField: 'category',
    count: true
});

categorySchema.virtual('productsCount', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'category',
    count: true
});


categorySchema.statics.findActive = function (){
    return this.find({ isActive:true }).sort({ sortOrder: 1, name: 1 })
}

categorySchema.methods.canBeDeleted = async function () {
    const Subcategory = mongoose.model('Subcategory');
    const Product = mongoose.model('Product');

    const SubcategoriesCount = await Subcategory.countDocuments({ category: this._id });
    const productsCount = await Product.countDocuments({ category: this._id });

    return SubcategoriesCount === 0 && productsCount === 0;
}

categorySchema.index({isActive:1})
categorySchema.index({sortOrder:1})
categorySchema.index({createdBy:1})

module.exports = mongoose.model('Category', categorySchema)