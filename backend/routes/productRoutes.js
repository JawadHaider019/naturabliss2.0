import express from 'express';
import adminAuth from '../middleware/adminAuth.js';
import { 
  addProduct, 
  listProducts, 
  removeProduct, 
  singleProduct, 
  updateProduct, 
  updateProductStatus

} from '../controllers/productController.js';
import upload from '../middleware/multer.js';

const router = express.Router();

router.post('/add', adminAuth, upload.any(), addProduct);

router.get('/list', listProducts);
router.post('/remove', adminAuth, removeProduct);
router.post('/single', singleProduct);
router.post('/update', adminAuth, upload.any(), updateProduct);

router.post('/update-status', adminAuth, updateProductStatus);



export default router;