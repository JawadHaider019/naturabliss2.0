import express from 'express';
import adminAuth from '../middleware/adminAuth.js';
import { 
  loginUser, 
  registerUser, 
  adminLogin, 
  forgotPassword, 
  resetPassword, 
  resendOtp,
  getUserData,
    getUserById  

} from '../controllers/userController.js';

const userRoutes = express.Router();

userRoutes.post('/register', registerUser);
userRoutes.post('/login', loginUser);
userRoutes.post('/admin', adminLogin);
userRoutes.post('/forgot-password', forgotPassword);
userRoutes.post('/reset-password', resetPassword);
userRoutes.post('/resend-otp', resendOtp);
userRoutes.get('/data', getUserData);
userRoutes.get('/:userId', adminAuth, getUserById);  

export default userRoutes;