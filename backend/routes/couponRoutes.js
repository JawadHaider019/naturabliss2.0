import express from "express";
import {
  validateCoupon,
  addCoupon,
  listCoupons,
  deleteCoupon,
  toggleCouponStatus,
} from "../controllers/couponController.js";
import adminAuth from "../middleware/adminAuth.js";

const couponRoutes = express.Router();

// Public checkout validation
couponRoutes.post("/validate", validateCoupon);

// Admin endpoints
couponRoutes.post("/add", adminAuth, addCoupon);
couponRoutes.get("/list", adminAuth, listCoupons);
couponRoutes.post("/delete", adminAuth, deleteCoupon);
couponRoutes.post("/toggle-status", adminAuth, toggleCouponStatus);

export default couponRoutes;
