import express from "express";
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
router.post("/", bannerUpload, createBanner);
router.put("/:id", bannerUpload, updateBanner);
router.delete("/:id", deleteBanner);
router.put("/order/update", updateBannerOrder);

export default router;