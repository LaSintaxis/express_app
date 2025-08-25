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

//obtener productos por categoria
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
    const product = await Product.findOne({ sku: req.params.sku.toUpperCase() })
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
        tags,
        isActive,
        isFeactured,
        isDigital,
        sortOrder,
        seoTitle,
        seoDescription
    } = req.body;

    const parentCategory = await Category.findById(category);
    if (!parentCategory || !parentCategory.isActive) {
        return res.status(400).json({
            success: false,
            message: 'La categoría especificada no existe o no está activa'
        });
    }

    const parentSubcategory = await Subcategory.findById(subcategory);
    if (!parentSubcategory || !parentSubcategory.isActive) {
        return res.status(400).json({
            success: false,
            message: 'La subcategoría especificada no existe o no está activa'
        });
    }

    if (parentSubcategory.category.toString() !== category) {
        return res.status(400).json({
            success: false,
            message: 'La subcategoría no pertenece a la categoría especificada'
        });
    }

    // Normalizar stock
    const normalizedStock = typeof stock === 'object'
        ? stock
        : { quantity: stock || 0, minStock: 0, trackStock: true };

    // Crear producto
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
        stock: normalizedStock,
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
    });

    await product.populate([
        { path: 'category', select: 'name slug' },
        { path: 'subcategory', select: 'name slug' }
    ]);

    res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: product
    });
});


//actualizar producto
const updateProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Producto no encontrado'
        });
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
        tags,
        isActive,
        isFeactured,
        isDigital,
        sortOrder,
        seoTitle,
        seoDescription
    } = req.body;

    // Validar SKU duplicado si cambia
    if (sku && sku.toUpperCase() !== product.sku) {
        const existingSku = await Product.findOne({ sku: sku.toUpperCase() });
        if (existingSku) {
            return res.status(400).json({
                success: false,
                message: 'El SKU ya existe'
            });
        }
    }

    // Definir categoría y subcategoría de destino
    const targetCategory = category || product.category;
    const targetSubcategory = subcategory || product.subcategory;

    // Validar categoría
    const parentCategory = await Category.findById(targetCategory);
    if (!parentCategory || !parentCategory.isActive) {
        return res.status(400).json({
            success: false,
            message: 'La categoría especificada no existe o no está activa'
        });
    }

    // Validar subcategoría
    const parentSubcategory = await Subcategory.findById(targetSubcategory);
    if (!parentSubcategory || !parentSubcategory.isActive) {
        return res.status(400).json({
            success: false,
            message: 'La subcategoría especificada no existe o no está activa'
        });
    }

    // Verificar relación categoría-subcategoría
    if (parentSubcategory.category.toString() !== targetCategory.toString()) {
        return res.status(400).json({
            success: false,
            message: 'La subcategoría no pertenece a la categoría especificada'
        });
    }

    // Actualizar campos
    if (name !== undefined) product.name = name;
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
    if (seoTitle !== undefined) product.seoTitle = seoTitle;
    if (seoDescription !== undefined) product.seoDescription = seoDescription;

    product.updatedBy = req.user._id;

    await product.save();
    await product.populate([
        { path: 'category', select: 'name slug' },
        { path: 'subcategory', select: 'name slug' },
    ]);

    res.status(200).json({
        success: true,
        message: 'Producto actualizado correctamente',
        data: product
    });
});


//eliminar un producto
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Producto no encontrado'
        })
    }
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({
        success: true,
        message: 'Producto eliminado correctamente'
    })
})
//activar o desactivar producto
const toggleProductStatus = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Producto no encontrado'
        })
    }
    product.isActive = !product.isActive;
    product.updatedBy = req.user._id;
    await product.save();

    res.status(200).json({
        success: true,
        message: `Producto ${product.isActive ? 'activado' : 'desactivado'} exitosamente`,
        data: product
    })
})

//actualizar stock del producto
const updateProductStock = asyncHandler(async (req, res) => {
    const { quantity, operation = 'set' } = req.body;
    if (quantity === undefined) {
        return res.status(400).json({
            success: false,
            message: 'la cantidad es requerida'
        })
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(400).json({
            success: false,
            message: 'Producto no encontrado'
        })
    }

    if (!product.stock.trackStock) {
        return res.status(400).json({
            success: false,
            message: 'Este producto no maneja un control de stock'
        })
    }

    //operaciones set add subtract
    switch (operation) {
        case 'set':
            product.stock.quantity = quantity;
            break;
        case 'add':
            product.stock.quantity += quantity;
            break;
        case 'subtract':
            product.stock.quantity = Math.max(0, product.stock.quantity - quantity);
            break;
        default:
            return res.status(400).json({
                success: false,
                message: 'operacion invalida Use: set, add, subtract'
            })
    }
    product.updatedBy = req.user._id;
    await product.save();
    res.status(200).json({
        success: true,
        message: 'stock actualizado exitosamente',
        data: {
            sku: product.sku,
            name: product.name,
            previousStock: product.stock.quantity,
            newStock: product.stock.quantity,
            isLowStock: product.isLowStock,
            isOutOfStock: product.isOutOfStock
        }
    })
})

//obtener estadisticas de productos
const getProductStats = asyncHandler(async (req, res) => {
    const stats = await Product.aggregate([
        {
            $group: {
                _id: null,
                totalProducts: { $sum: 1 },
                activateProducts: {
                    $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                },
                feacturedProducts: {
                    $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                },
                digitalProducts: {
                    $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                },
                totalValue: { $sum: '$price'},
                averagePrice: { $avg: '$price'}
            }
        }
    ])
    //productos con stock bajo
    const lowStockProducts = await Product.find({
        'stock.trackStock': true,
        $expr: { $lte: ['stock.quantity', 'stock.minStock']}
    })
    .select('name sku stock.quantity stock.minStock')
    .limit(10);

    const expensiveProducts = await Product.find({ isActive: true })
    .sort({ price: -1})
    .limit(5)
    .select('name sku price')

    res.status(200).json({
        success: true,
        data: {
            stats: stats[0] || {
                totalProducts: 0,
                activateProducts: 0,
                feacturedProducts: 0,
                digitalProducts: 0,
                totalValue: 0,
                averagePrice: 0,
            },
            lowStockProducts,
            expensiveProducts
        }
    })
})

module.exports = {
    getProducts,
    getActiveProducts,
    getProductsByCategory,
    getProductsBySubcategory,
    getFeacturedProducts,
    getProductById,
    getProductBySku,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    updateProductStock,
    getProductStats
}