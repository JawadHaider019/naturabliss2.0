import express from 'express';
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

router.post('/add', upload.any(), addProduct);

router.get('/list', listProducts);
router.post('/remove', removeProduct);
router.post('/single', singleProduct);
router.post('/update', upload.any(), updateProduct);

router.post('/update-status', updateProductStatus);



export default router;