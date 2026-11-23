import express from 'express';
import adminAuth from '../middleware/adminAuth.js';
import { 
  addDeal, 
  listDeals, 
  removeDeal, 
  singleDeal, 
  updateDeal, 
  updateDealStatus

} from '../controllers/dealController.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/add', adminAuth, upload.fields([
  { name: 'dealImage1', maxCount: 1 },
  { name: 'dealImage2', maxCount: 1 },
  { name: 'dealImage3', maxCount: 1 },
  { name: 'dealImage4', maxCount: 1 }
]), addDeal);

router.get('/list', listDeals);
router.post('/remove', adminAuth, removeDeal);
router.post('/single', singleDeal);
router.post('/update', adminAuth, upload.fields([
  { name: 'dealImage1', maxCount: 1 },
  { name: 'dealImage2', maxCount: 1 },
  { name: 'dealImage3', maxCount: 1 },
  { name: 'dealImage4', maxCount: 1 }
]), updateDeal);
router.post('/update-status', adminAuth, updateDealStatus);


export default router;