import express from 'express';
import adminAuth from '../middleware/adminAuth.js';
import {
  subscribe,
  unsubscribe,
  getSubscribers,
  getStats,
  sendNotification,
  checkSubscriberPreferences
} from '../controllers/newsletterController.js';

const router = express.Router();

// Public routes
router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);

// Admin routes
router.get('/subscribers', adminAuth, getSubscribers);
router.get('/stats', adminAuth, getStats);
router.get('/preferences-stats', adminAuth, checkSubscriberPreferences);
router.post('/notify', adminAuth, sendNotification);


export default router;