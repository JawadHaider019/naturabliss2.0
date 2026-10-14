// controllers/categoryController.js
import Category from '../models/categoryModel.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY || process.env.CLOUDINARY_API_SECRET,
});

// Get all categories with subcategories
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new category
const createCategory = async (req, res) => {
  try {
    const { name, image } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Category name is required' });
    }

    let imageUrl = image || '';

    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'categories',
          resource_type: 'image'
        });
        imageUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary category upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload category image' });
      } finally {
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      }
    }

    const category = new Category({
      name: name.trim(),
      image: imageUrl,
      subcategories: []
    });

    const savedCategory = await category.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add subcategory to existing category
const addSubcategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Subcategory name is required' });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const newSubcategory = {
      name: name.trim(),
      count: 0
    };

    category.subcategories.push(newSubcategory);
    const updatedCategory = await category.save();

    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    category.name = name.trim();

    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'categories',
          resource_type: 'image'
        });
        category.image = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary category upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload category image' });
      } finally {
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      }
    } else if (image !== undefined) {
      category.image = image;
    }

    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update subcategory
const updateSubcategory = async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Subcategory name is required' });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const subcategory = category.subcategories.id(subcategoryId);
    if (!subcategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    subcategory.name = name.trim();
    const updatedCategory = await category.save();

    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete subcategory - FIXED VERSION
const deleteSubcategory = async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const subcategory = category.subcategories.id(subcategoryId);
    if (!subcategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    // Use pull method for more reliable deletion
    category.subcategories.pull({ _id: subcategoryId });
    await category.save();

    res.json({ 
      message: 'Subcategory deleted successfully',
      success: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Add this to your categoryController.js
const getCategoriesDebug = async (req, res) => {
  try {
    const categories = await Category.find({});
    console.log('=== ALL CATEGORIES IN DATABASE ===');
    categories.forEach(cat => {
      console.log(`Category: ${cat.name} (ID: ${cat._id})`);
      console.log('Subcategories:', cat.subcategories.map(sub => ({
        name: sub.name,
        id: sub._id
      })));
      console.log('---');
    });
    
    res.json({ 
      success: true, 
      categories: categories.map(cat => ({
        _id: cat._id,
        name: cat.name,
        image: cat.image,
        subcategories: cat.subcategories
      }))
    });
  } catch (error) {
    console.error('Debug categories error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export {
  getAllCategories,
  createCategory,
  addSubcategory,
  updateCategory,
  updateSubcategory,
  deleteCategory,
  deleteSubcategory,
  getCategoriesDebug
};