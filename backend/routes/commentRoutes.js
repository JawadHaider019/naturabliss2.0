import express from "express";
import adminAuth from '../middleware/adminAuth.js';
import {
  getComments,
  addComment,
  markRead,
  markUnread,
  addReply,
  likeComment,
  dislikeComment,
  removeLike,
  removeDislike,
  deleteComment,
  getNotifications,
} from "../controllers/commentController.js";
import upload from "../middleware/multer.js";

const router = express.Router();

// 🔹 GET all comments (supports ?productId= or ?dealId=)
router.get("/", getComments);

// 🔹 POST new comment (supports both products & deals)
router.post("/", upload.array("reviewImages", 5), addComment);

// 🔹 Admin + User actions
router.patch("/:id/read", adminAuth, markRead);
router.patch("/:id/unread", adminAuth, markUnread);
router.patch("/:id/reply", adminAuth, addReply);
router.patch("/:id/like", likeComment);
router.patch("/:id/dislike", dislikeComment);
router.patch("/:id/remove-like", removeLike);
router.patch("/:id/remove-dislike", removeDislike);
router.delete("/:id", adminAuth, deleteComment);

// 🔹 Notifications
router.get("/notifications/new", adminAuth, getNotifications);

export default router;
