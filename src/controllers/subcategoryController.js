const { Subcategory, Category, Product } = require('../models');
const { asyncHandler } = require('../middlewares/errorHandler');

//Obtener todas las subcategorias
const getSubcategories = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    //filtros para la busqueda
    const filter = {}

    //activo/inactivo
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    //Nombre o descripcion
    if (req.query.search) {
        filter.$or = [
            { name: { $regex: req.query.search, $options: 'i' } },
            { description: { $regex: req.query.search, $options: 'i' } }
        ]
    }
    //consulta a la base de datos
    let query = Subcategory.find(filter)
        .populate('createdBy', 'name slug isActive')
        .populate('createdBy', 'username firstName lastName')
        .populate('productsCount')
        .sort({ sortOrder: 1, name: 1 })

    if (req.query.page) {
        query = query.skip(skip).limit(limit)
    }

    //ejecutar las consultas
    const subcategories = await query;
    const total = await Subcategory.countDocuments(filter);
    res.status(200).json({
        success: true,
        data: subcategories,
        pagination: req.query.page ? {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        } : undefined
    })
})

//obtener subcategorias por categoria
const getSubcategoriesByCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    //verificar si la categoria existe y esta activa
    const category = await Category.findById(categoryId);
    if (!category) {
        return res.status(404).json({
            success: false,
            message: 'Categoria no encontrada'
        })
    }
    const subcategories = await Subcategory.findByIdCategory(categoryId);
    res.status(200).json({
        success: true,
        data: subcategories
    })
})

const getActiveSubcategories = asyncHandler(async (req, res) => {
    const subcategories = await Subcategory.findActive();
    res.status(200).json({
        success: true,
        data: subcategories
    })
})

//obtener una subcategoria por ID
const getSubcategoryById = asyncHandler(async (req, res) => {
    const subcategory = await Subcategory.findById(req.params.id)
        .populate('category', 'name slug description')
        .populate('createdBy', 'username firstName lastName')
        .populate('updatedBy', 'username firstName lastName')
    if (!subcategory) {
        return res.status(404).json({
            success: false,
            message: 'Subcategoria no encontrada'
        })
    }
    //obtener productos de esta subcategoria
    const products = await Product.find({
        subcategory: subcategory._id,
        isActive: true
    })
        .select('name price stock.quantity isActive')
        .sort({ sortOrder: 1, name: 1 })
    res.status(200).json({
        success: true,
        data: {
            ...subcategory.toObject(),
            products
        }
    })
})

//crear subcategoria
const createSubcategory = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        category,
        categoryId,
        icon,
        color,
        sortOrder,
        isActive
    } = req.body

    const targetCategoryId = categoryId || category;
    if (!name || !targetCategoryId) {
        return res.status(400).json({
            success: false,
            message: 'el nombre y la categoria son requeridos'
        })
    }
    const parentCategory = await Category.findById(targetCategoryId)
    if (!parentCategory) {
        return res.status(400).json({
            success: false,
            message: 'La categoria especificada no existe'
        })
    }
    if (!parentCategory.isActive) {
        return res.status(400).json({
            success: false,
            message: 'La categoria especificada no está activa'
        })
    }
    //verificar si la subcategoria ya existe en esa categoria
    const existingSubcategory = await Subcategory.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        category: targetCategoryId
    })
    if (existingSubcategory) {
        return res.status(400).json({
            success: false,
            message: 'ya existe una subcategoria con ese nombre en esta categoria'
        })
    }
    //crear la subcategoria
    const subcategory = await Subcategory.create({
        name,
        description,
        category: targetCategoryId,
        icon,
        color,
        sortOrder: sortOrder || 0,
        isActive: isActive !== undefined ? isActive : true,
        createdBy: req.user._id
    })
    await subcategory.populate('category', 'name slug')
    res.status(201).json({
        success: true,
        message: 'subcategoria creada exitosamente',
        data: subcategory
    })
})

const updateSubcategory = asyncHandler(async (req, res) => {
    const subcategory = await Subcategory.findById(req.params.id);
    if (!subcategory) {
        return res.status(404).json({
            success: false,
            message: 'Subcategoria no encontrada'
        })
    }
    const {
        name,
        description,
        category,
        categoryId,
        icon,
        color,
        sortOrder,
        isActive
    } = req.body

    const targetCategoryId = categoryId || category
    //si cambia la categoria validar que exista y este activa
    if (targetCategoryId && targetCategoryId !== subcategory.category.toString()) {
        const parentCategory = await Category.findById(targetCategoryId)
        if (!parentCategory) {
            return res.status(400).json({
                success: false,
                message: 'la categoria especificada no existe'
            })
        }
        if (!parentCategory.isActive) {
            return res.status(400).json({
                success: false,
                message: 'la categoriaespecificada no esta activa'
            })
        }
    }

    //verificar duplicados
    if ((name && name !== subcategory.name) || (targetCategoryId && targetCategoryId !== subcategory.category.toString())) {
        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') }
        })
        if (existingCategory) {
            return res.status(400).json({
                success: true,
                message: 'Ya existe una categoria con este nombre'
            })
        }
    }
    //Actualizar la categoria
    if (name) subcategory.name = name;
    if (description !== undefined) subcategory.description = description;
    if (icon !== undefined) subcategory.icon = icon;
    if (color !== undefined) subcategory.color = color;
    if (sortOrder !== undefined) subcategory.sortOrder = sortOrder;
    if (isActive !== undefined) subcategory.isActive = isActive;
    subcategory.updatedBy = req.user._id;
    await subcategory.save();
    res.status(200).json({
        success: true,
        message: 'categoria actualizada correctamente',
        data: subcategory
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
    const canDelete = await subcategory.canBeDeleted();
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
                from: 'products',
                localField: '_id',
                foreignField: 'subcategory',
                as: 'products'
            }
        },
        {
            $lookup: {
                from: 'categories',
                localField: 'category',   // 🔥 corregido
                foreignField: '_id',
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
        { $sort: { productsCount: -1 } },
        { $limit: 5 }
    ])

    res.status(200).json({
        success: true,
        data: {
            stats: stats[0] || {
                totalSubcategories: 0,
                activateSubcategories: 0
            },
            topSubcategories: subcategoriesWithSubcounts // 🔥 corregido
        }
    })
})


module.exports = {
    getSubcategories,
    getSubcategoriesByCategory,
    getActiveSubcategories,
    getSubcategoryById,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    toggleSubcategoryStatus,
    reorderSubcategories,
    getSubcategoryStats
}