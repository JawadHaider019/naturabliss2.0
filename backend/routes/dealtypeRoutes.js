// routes/dealTypes.js
import express from 'express';
import adminAuth from '../middleware/adminAuth.js';
import {
  getAllDealTypes,
  createDealType,
  updateDealType,
  deleteDealType
} from '../controllers/dealtypeController.js';

const router = express.Router();

// Routes
router.get('/', getAllDealTypes);
router.post('/', adminAuth, createDealType);
router.put('/:id', adminAuth, updateDealType);
router.delete('/:id', adminAuth, deleteDealType);

export default router;
