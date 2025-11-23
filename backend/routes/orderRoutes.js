import express from "express"
import { 
  placeOrder, 
  allOrders, 
  userOrders, 
  updateStatus, 
  cancelOrder,
  getCancellationReasons,
  checkStock,
  getUserNotifications,
  getAdminNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getOrderDetails // 🆕 Import the new function
} from "../controllers/orderController.js"
import { authUser } from "../middleware/auth.js"
import  adminAuth  from "../middleware/adminAuth.js"

const orderRoutes = express.Router()

// Admin routes
orderRoutes.get("/list", adminAuth, allOrders)
orderRoutes.post("/status", adminAuth, updateStatus)

// Payment
orderRoutes.post("/place", authUser, placeOrder)

// User orders
orderRoutes.post("/userorders", authUser, userOrders)
orderRoutes.post("/cancel", authUser, cancelOrder)
orderRoutes.get("/:orderId", authUser, getOrderDetails) // 🆕 Get specific order details

// Cancellation reasons
orderRoutes.get("/cancellation-reasons", getCancellationReasons)

// Stock check
orderRoutes.post("/check-stock", authUser, checkStock)

// 🆕 NOTIFICATION ROUTES
orderRoutes.get("/notifications", authUser, getUserNotifications)
orderRoutes.get("/admin/notifications", adminAuth, getAdminNotifications)
orderRoutes.post("/notifications/mark-read", authUser, markNotificationAsRead)
orderRoutes.post("/notifications/mark-all-read", authUser, markAllNotificationsAsRead)

export default orderRoutes