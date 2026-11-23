import express from 'express';
import adminAuth from '../middleware/adminAuth.js';
import upload from '../middleware/multer.js';
import {
  getAllCategories,
  createCategory,
  addSubcategory,
  updateCategory,
  updateSubcategory,
  deleteCategory,
  deleteSubcategory,
  getCategoriesDebug
} from '../controllers/categoryController.js';

const router = express.Router();

router.get('/', getAllCategories);
router.get('/list', getAllCategories); // Add this duplicate route for frontend compatibility
router.post('/', adminAuth, upload.single('image'), createCategory);
router.post('/:categoryId/subcategories', adminAuth, addSubcategory);
router.put('/:id', adminAuth, upload.single('image'), updateCategory);
router.put('/:categoryId/subcategories/:subcategoryId', adminAuth, updateSubcategory);
router.delete('/:id', adminAuth, deleteCategory);
router.delete('/:categoryId/subcategories/:subcategoryId', adminAuth, deleteSubcategory);
router.get('/debug', adminAuth, getCategoriesDebug);
export default router;