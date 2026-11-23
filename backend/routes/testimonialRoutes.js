import express from 'express';
import adminAuth from '../middleware/adminAuth.js';
import { 
  getTestimonials, 
  addTestimonial, 
  updateTestimonial, 
  deleteTestimonial 
} from '../controllers/testimonialController.js';

const router = express.Router();

router.get('/', getTestimonials);
router.post('/', adminAuth, addTestimonial);
router.put('/:id', adminAuth, updateTestimonial);
router.delete('/:id', adminAuth, deleteTestimonial);

export default router;
