import express from "express";
import adminAuth from '../middleware/adminAuth.js';
import {
  getAllBanners,
  getActiveBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  updateBannerOrder,
} from "../controllers/bannerController.js";

import { bannerUpload } from "../middleware/multer.js";

const router = express.Router();

// 🟩 Routes
router.get("/", getAllBanners);
router.get("/active", getActiveBanners);
router.get("/:id", getBannerById);
router.post("/", adminAuth, bannerUpload, createBanner);
router.put("/:id", adminAuth, bannerUpload, updateBanner);
router.delete("/:id", adminAuth, deleteBanner);
router.put("/order/update", adminAuth, updateBannerOrder);

export default router;