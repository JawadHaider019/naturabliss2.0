import express from 'express';
import cors from "cors"; 
import dotenv from "dotenv";
import connectDB from "./config/mongodb.js";
import connectCloudinary from './config/cloudinary.js';

import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import settingRoutes from "./routes/settingRoutes.js";
import dealRoutes from './routes/dealRoutes.js';
import dashboardRoutes from "./routes/dashboradRoutes.js";
import categoriesRoutes from './routes/categoryRoutes.js';
import dealtypesRoutes from './routes/dealtypeRoutes.js';
import testimonialRoutes from './routes/testimonialRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js'
import commentRoutes from './routes/commentRoutes.js'
import deliverySettingsRoutes from './routes/deliverySettingsRoutes.js';
import blogRoutes from './routes/blogRoutes.js'
import teamRoutes from './routes/teamRoutes.js';
import businessDetailsRoutes from './routes/businessDetailsRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import newsletterRoutes from './routes/NewsletterRoutes.js'

// App Config    
dotenv.config();
connectDB();
connectCloudinary();

const app = express();
app.use(express.json()); 
app.use(cors());

// API endpoints 
app.use('/api/user',userRoutes)
app.use('/api/product',productRoutes)
app.use('/api/deal',dealRoutes)
app.use('/api/cart',cartRoutes)
app.use('/api/order',orderRoutes)
app.use("/api/settings", settingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/deal-types', dealtypesRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/banners', bannerRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/delivery-settings", deliverySettingsRoutes);
app.use("/api/blogs",blogRoutes)
app.use('/api/teams', teamRoutes);
app.use('/api/business-details', businessDetailsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);

app.get('/', (req, res) => {
    res.send("API Working ✅");
});

export default app;
