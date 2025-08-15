const { Product, Subcategory, Category } = require('../models');
const { asyncHandler } = require('../middlewares/errorHandler');

//Obtener todas las subcategorias
const getProducts = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    //filtros para la busqueda
    const filter = {}

    //filtros por categoria y subcategoria
    if (req.query.category) filter.category = req.query.category;
    if (req.query.subcategory) filter.subcategory = req.query.subcategory;

    //filtros booleanos (estado destacado digital)
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.isFeactured !== undefined) filter.isFeactured = req.query.isFeactured === 'true';
    if (req.query.isDigital !== undefined) filter.isDigital = req.query.isDigital === 'true';

    //filtro por rangos de precios
    if (req.query.minPrice || req.query.maxPrice) {
        filter.price = {};
        if (req.query.minPrice) filter.price.$gte = parseInt(req.query.minPrice)
        if (req.query.maxPrice) filter.price.$lte = parseInt(req.query.maxPrice)
    }

    //filtro de stock bajo
    if (req.query.lowStock === 'true') {
        filter.$expr = {
            $and: [
                { $eq: ['stock.trackStock', true] },
                { $lte: ['stock.quantity', '$stock.minStock'] }
            ]
        }
    }

    //
    if (req.query.search) {
        filter.$or = [
            { name: { $regex: req.query.search, $options: 'i' } },
            { description: { $regex: req.query.search, $options: 'i' } },
            { name: { $regex: req.query.search, $options: 'i' } },
            { tags: { $regex: req.query.search, $options: 'i' } },
        ]
    }

    //consulta a la base de datos
    let query = Product.find(filter)
        .populate('category', 'name slug')
        .populate('subcategory', 'name slug')
        .populate('createdBy', 'username firstName lastName')
        .sort({ sortOrder: 1, name: 1 })

    if (req.query.page) {
        query = query.skip(skip).limit(limit)
    }

    //ejecutar las consultas
    const products = await query;
    const total = await Product.countDocuments(filter);
    res.status(200).json({
        success: true,
        data: products,
        pagination: req.query.page ? {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        } : undefined
    })
})

const getActiveProducts = asyncHandler(async (req, res) => {
    const products = await Product.findActive();
    res.status(200).json({
        success: true,
        data: products
    })
})

//obtener subcategorias por categoria
const getProductsByCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    //verificar si la categoria existe y esta activa
    const products = await Product.findByCategory(categoryId);
    return res.status(200).json({
        success: true,
        data: products
    })
})
const getProductsBySubcategory = asyncHandler(async (req, res) => {
    const { subcategoryId } = req.params;
    //verificar si la categoria existe y esta activa
    const products = await Product.findBySubcategory(subcategoryId);
    return res.status(200).json({
        success: true,
        data: products
    })

})
const getFeacturedProducts = asyncHandler(async (req, res) => {
    const products = await Product.findFeactured();
    res.status(200).json({
        success: true,
        data: products
    })
})


//obtener producto por ID
const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)
        .populate('category', 'name slug description')
        .populate('subcategory', 'name slug description')
        .populate('createdBy', 'username firstName lastName')
        .populate('updatedBy', 'username firstName lastName')
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Producto no encontrado'
        })
    }
    res.status(200).json({
        success: true,
        data: product
    })
})

//obtener producto por codigo
const getProductBySku = asyncHandler(async (req, res) => {
    const product = await Product.findByOne({ sku: req.params.sku.toUpperCase() })
        .populate('category', 'name slug')
        .populate('subcategory', 'name slug')
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Producto no encontrado'
        })
    }
    res.status(200).json({
        success: true,
        data: product
    })
})

//crear un producto
const createProduct = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        shortDescription,
        sku,
        category,
        subcategory,
        price,
        comparePrice,
        cost,
        stock,
        dimensions,
        images,
        isActive,
        isFeactured,
        isDigital,
        sortOrder,
        seoTitle,
        seoDescription,
        createdBy
    } = req.body

    const parentCategory = await Category.findById(category)
    if (!parentCategory) {
        return res.status(400).json({
            success: false,
            message: 'La categoria especificada no existe'
        })
    }

    const parentSubcategory = await Subcategory.findById(subcategory)
    if (!parentSubcategory || !parentSubcategory.isActive) {
        return res.status(400).json({
            success: false,
            message: 'La subcategoria especificada no existe o no esta activa'
        })
    }

    if (!parentSubcategory.category.toString() !== category) {
        return res.status(400).json({
            success: false,
            message: 'La subcategoria no pertenece a la categoría especificada'
        })
    }

    //crear producto
    const product = await Product.create({
        name,
        description,
        shortDescription,
        sku: sku.toUpperCase(),
        category,
        subcategory,
        price,
        comparePrice,
        cost,
        stock: stock || { quantity: 0, minStock: 0, trackStock: true },
        dimensions,
        images,
        tags: tags || [],
        isActive: isActive !== undefined ? isActive : true,
        isFeactured: isFeactured || false,
        isDigital: isDigital || false,
        sortOrder: sortOrder || 0,
        seoTitle,
        seoDescription,
        createdBy: req.user._id
    })

    await product.populate([
        { path: 'category', select: 'name slug' },
        { path: 'subcategory', select: 'name slug' }
    ])

    res.status(201).json({
        success: true,
        message: 'producto creado exitosamente',
        data: product
    })
})

//actualizar producto
const updateProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'producto no encontrado'
        })
    }
    const {
        name,
        description,
        shortDescription,
        sku,
        category,
        subcategory,
        price,
        comparePrice,
        cost,
        stock,
        dimensions,
        images,
        isActive,
        isFeactured,
        isDigital,
        sortOrder,
        seoTitle,
        seoDescription,
        createdBy
    } = req.body

    if (sku && sku.toUpperCase() !== product.sku) {
        const existingSku = await Product.findOne({ sku: sku.toUpperCase() })
        if (existingSku) {
            return res.status(400).json({
                success: false,
                message: 'El sku ya existe'
            })
        }
    }

    if (category || subcategory) {
        const targetCategory = category || product.category;
        const targetSubcategory = subcategory || product.subcategory;
        //si cambia la categoria validar que exista y este activa
        const parentCategory = await Category.findById(targetCategory)
        if (!parentCategory || !parentCategory.isActive) {
            return res.status(400).json({
                success: false,
                message: 'la categoria especificada no existe o no esta activa'
            })
        }
        //si cambia la subcategoria validar que exista y este activa
        const parentSubcategory = await Subcategory.findById(targetSubcategory)
        if (!parentSubcategory || !parentSubcategory.isActive) {
            return res.status(400).json({
                success: false,
                message: 'la subcategoria especificada no existe o no esta activa'
            })
        }
    }

    //verificar duplicados
    if (parentSubcategory.category.toString() !== targetCategory.toString()) {
        return res.status(400).json({
            success: false,
            message: 'la subcategoria no pertenece a la categoria especificada'
        })
    }

    //Actualizar Producto
    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (shortDescription !== undefined) product.shortDescription = shortDescription;
    if (sku) product.sku = sku.toUpperCase();
    if (category) product.category = category;
    if (subcategory) product.subcategory = subcategory;
    if (price !== undefined) product.price = price;
    if (comparePrice !== undefined) product.comparePrice = comparePrice;
    if (cost !== undefined) product.cost = cost;
    if (stock !== undefined) product.stock = stock;
    if (dimensions !== undefined) product.dimensions = dimensions;
    if (images !== undefined) product.images = images;
    if (tags !== undefined) product.tags = tags;
    if (isActive !== undefined) product.isActive = isActive;
    if (isFeactured !== undefined) product.isFeactured = isFeactured;
    if (isDigital !== undefined) product.isDigital = isDigital;
    if (sortOrder !== undefined) product.sortOrder = sortOrder;
    if ( seoDescription !== undefined) product.seoDescription  = seoDescription ;
    if (sortOrder !== undefined) product.sortOrder = sortOrder;
    if (isActive !== undefined) product.isActive = isActive;
    product.updatedBy = req.user._id;
    await product.save();
    res.status(200).json({
        success: true,
        message: 'categoria actualizada correctamente',
        data: product
    })
})

//eliminar una categoria
const deleteSubcategory = asyncHandler(async (req, res) => {
    const subcategory = await Subcategory.findById(req.params.id);
    if (!subcategory) {
        return res.status(404).json({
            success: false,
            message: 'Subcategoria no encontrada'
        })
    }
    //verificar si se puede eliminar
    const canDelete = await subcategory.canDelete();
    if (!canDelete) {
        return res.status(400).json({
            success: false,
            message: 'No se puede eliminar la subcategoria porque tiene productos asociados'
        })
    }
    await Subcategory.findByIdAndDelete(req.params.id);
    res.status(200).json({
        success: true,
        message: 'Subcategoria eliminada correctamente'
    })
})
//activar o desactivar categoria
const toggleSubcategoryStatus = asyncHandler(async (req, res) => {
    const subcategory = await Subcategory.findById(req.params.id);
    if (!subcategory) {
        return res.status(404).json({
            success: false,
            message: 'Subcategoria no encontrada'
        })
    }
    subcategory.isActive = !subcategory.isActive;
    subcategory.updatedBy = req.user._id;
    await subcategory.save();
    //si la subcategoria se desactiva, desactivar productos asociados
    if (!subcategory.isActive) {
        await Subcategory.updateMany(
            { subcategory: subcategory._id },
            { isActive: false, updatedBy: req.user._id }
        );
    }
    res.status(200).json({
        success: true,
        message: `subcategoria ${subcategory.isActive ? 'activada' : 'desactivada'} exitosamente`,
        data: subcategory
    })
})
//ordenar subcategorias
const reorderSubcategories = asyncHandler(async (req, res) => {
    const { subcategoryIds } = req.body;
    if (!Array.isArray(subcategoryIds)) {
        return res.status(400).json({
            success: false,
            message: 'Se requiere un array de IDs de subcategorias'
        })
    }
    //actualizar  el orden de las subcategorias
    const updatePromises = subcategoryIds.map((subcategoryId, index) =>
        Subcategory.findByIdAndUpdate(
            subcategoryId,
            {
                sortOrder: index + 1,
                updatedBy: req.user._id
            },
            { new: true }
        )
    )
    await Promise.all(updatePromises);
    res.status(200).json({
        success: true,
        message: 'Orden de subcategorias actualizado correctamente'
    })
})
//obtener estadisticas de subcategorias
const getSubcategoryStats = asyncHandler(async (req, res) => {
    const stats = await Subcategory.aggregate([
        {
            $group: {
                _id: null,
                totalSubcategories: { $sum: 1 },
                activateSubcategories: {
                    $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                },
            }
        }
    ])
    const subcategoriesWithSubcounts = await Subcategory.aggregate([
        {
            $lookup: {
                from: '$products',
                localField: '_id',
                foreignField: 'subcategory',
                as: 'products'
            }
        },
        {
            $lookup: {
                from: '$categories',
                localField: '_id',
                foreignField: 'category',
                as: 'categoryInfo'
            }
        },
        {
            $project: {
                name: 1,
                categoryName: { $arrayElemAt: ['$categoryInfo.name', 0] },
                productsCount: { $size: '$products' }
            }
        },
        { sort: { productsCount: -1 } },
        { limit: 5 }
    ])
    res.status(200).json({
        success: true,
        data: {
            stats: stats[0] || {
                totalSubcategories: 0,
                activateSubcategories: 0
            },
            topSubategories: subcategoriesWithSubcounts
        }
    })
})

module.exports = {
    getSubcategories,
    getSubcategoriesByCategory,
    getActiveSubcategory,
    getSubcategoryById,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    toggleSubcategoryStatus,
    reorderSubcategories,
    getSubcategoryStats
}