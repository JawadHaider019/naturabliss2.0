import express from "express";
import {
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  toggleFeatured,
  togglePublishStatus,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadBlogImage,
} from "../controllers/blogController.js";

import upload from "../middleware/multer.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// 🟩 Category Routes (MOVE THESE BEFORE BLOG ROUTES)
router.get("/categories", getAllCategories);
router.post("/categories", adminAuth, createCategory);
router.put("/categories/:id", adminAuth, updateCategory);
router.delete("/categories/:id", adminAuth, deleteCategory);

// 🟩 Blog Image Upload
router.post("/upload-image", adminAuth, upload.single("image"), uploadBlogImage);

// 🟩 Blog Routes (THESE COME AFTER CATEGORY ROUTES)
router.get("/", getAllBlogs);
router.get("/:id", getBlogById);

// Use upload middleware for single file (image/video) with field "media"
router.post("/", adminAuth, upload.single("media"), createBlog);
router.put("/:id", adminAuth, upload.single("media"), updateBlog);

router.delete("/:id", adminAuth, deleteBlog);
router.patch("/:id/featured", adminAuth, toggleFeatured);
router.patch("/:id/publish-status", adminAuth, togglePublishStatus);

export default router;