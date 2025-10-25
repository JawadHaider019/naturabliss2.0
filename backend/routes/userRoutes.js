// routes/userRoutes.js
import express from 'express';
import { 
  loginUser, 
  registerUser, 
  adminLogin, 
  forgotPassword, 
  resetPassword, 
  resendOtp 
} from '../controllers/userController.js';

const userRoutes = express.Router();

userRoutes.post('/register', registerUser);
userRoutes.post('/login', loginUser);
userRoutes.post('/admin', adminLogin);
userRoutes.post('/forgot-password', forgotPassword);
userRoutes.post('/reset-password', resetPassword);
userRoutes.post('/resend-otp', resendOtp);

export default userRoutes;