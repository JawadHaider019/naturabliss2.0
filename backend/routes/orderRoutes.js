import express from "express"
import { 
  placeOrder, 
  allOrders, 
  userOrders, 
  updateStatus, 
  cancelOrder,
  cancelGuestOrder,
  getCancellationReasons,
  checkStock,
  getUserNotifications,
  getAdminNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getOrderDetails,
  getGuestOrderDetails,
  getGuestOrders
} from "../controllers/orderController.js"
import { authUser } from "../middleware/auth.js"
import adminAuth from "../middleware/adminAuth.js"

const orderRoutes = express.Router()

// Admin routes
orderRoutes.get("/list", adminAuth, allOrders)
orderRoutes.post("/status", adminAuth, updateStatus)
orderRoutes.get("/admin/notifications", adminAuth, getAdminNotifications)

// 🆕 PUBLIC ORDER PLACEMENT (for both guest and logged-in users)
orderRoutes.post("/place", placeOrder) // No auth middleware!

// User routes (require auth)
orderRoutes.post("/userorders", authUser, userOrders)
orderRoutes.post("/cancel", authUser, cancelOrder)
orderRoutes.get("/:orderId", authUser, getOrderDetails)

// Guest routes (public, no auth required)
orderRoutes.post("/guest-orders", getGuestOrders)
orderRoutes.post("/guest-order-details", getGuestOrderDetails)
orderRoutes.post("/cancel-guest", cancelGuestOrder)

// Public routes
orderRoutes.get("/cancellation-reasons", getCancellationReasons)
orderRoutes.post("/check-stock", checkStock)

// Notification routes (require auth)
orderRoutes.get("/notifications", authUser, getUserNotifications)
orderRoutes.post("/notifications/mark-read", authUser, markNotificationAsRead)
orderRoutes.post("/notifications/mark-all-read", authUser, markAllNotificationsAsRead)

export default orderRoutes