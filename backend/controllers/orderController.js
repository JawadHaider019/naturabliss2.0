import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import notificationModel from "../models/notifcationModel.js";
import Comment from "../models/commentModel.js"; // Your existing comment model

// 🆕 Notification Types
const NOTIFICATION_TYPES = {
  ORDER_PLACED: 'order_placed',
  ORDER_CANCELLED: 'order_cancelled', 
  ORDER_STATUS_UPDATED: 'order_status_updated',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
  NEW_COMMENT: 'new_comment',
  COMMENT_REPLY: 'comment_reply'
};

// 🆕 Create Notification Function
const createNotification = async (notificationData) => {
  try {
    const notification = new notificationModel(notificationData);
    await notification.save();
    console.log(`🔔 Notification created: ${notification.title}`);
    return notification;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
  }
};

// 🆕 UPDATED: Send Order Placed Notification with Customer Details
const sendOrderPlacedNotification = async (order) => {
  const userDetails = await userModel.findById(order.userId);
  const shortOrderId = order._id.toString().slice(-6);
  
  // Use customer details from order (which may be edited) or fallback to user profile
  const customerName = order.customerDetails?.name || userDetails?.name || 'Customer';
  const customerEmail = order.customerDetails?.email || userDetails?.email || '';
  
  // User notification
  await createNotification({
    userId: order.userId,
    type: NOTIFICATION_TYPES.ORDER_PLACED,
    title: '🎉 Order Placed Successfully!',
    message: `Your order #${shortOrderId} has been placed. Total: $${order.amount}`,
    relatedId: order._id.toString(),
    relatedType: 'order',
    actionUrl: `/orders/${order._id}`,
    metadata: {
      orderId: order._id.toString(),
      amount: order.amount,
      itemsCount: order.items.length,
      customerName: customerName,
      customerEmail: customerEmail
    }
  });

  // Admin notification - using order customer details
  await createNotification({
    userId: 'admin',
    type: NOTIFICATION_TYPES.ORDER_PLACED,
    title: '🛒 New Order Received',
    message: `New order #${shortOrderId} from ${customerName}. Amount: $${order.amount}`,
    relatedId: order._id.toString(),
    relatedType: 'order',
    isAdmin: true,
    actionUrl: `/admin/orders/${order._id}`,
    priority: 'high',
    metadata: {
      orderId: order._id.toString(),
      customerName: customerName,
      customerEmail: customerEmail,
      amount: order.amount,
      itemsCount: order.items.length
    }
  });

  console.log(`🔔 Order placed notifications sent for order ${order._id} from customer ${customerName}`);
};

// 🆕 UPDATED: Send Order Cancelled Notification with Customer Details
const sendOrderCancelledNotification = async (order, cancelledBy, reason = '') => {
  const userDetails = await userModel.findById(order.userId);
  const shortOrderId = order._id.toString().slice(-6);
  const cancelledByText = cancelledBy === 'user' ? 'You have' : 'Admin has';
  
  // Use customer details from order
  const customerName = order.customerDetails?.name || userDetails?.name || 'Customer';
  
  // User notification
  await createNotification({
    userId: order.userId,
    type: NOTIFICATION_TYPES.ORDER_CANCELLED,
    title: '❌ Order Cancelled',
    message: `${cancelledByText} cancelled order #${shortOrderId}.${reason ? ` Reason: ${reason}` : ''}`,
    relatedId: order._id.toString(),
    relatedType: 'order',
    actionUrl: `/orders/${order._id}`,
    metadata: {
      orderId: order._id.toString(),
      cancelledBy,
      reason,
      amount: order.amount,
      customerName: customerName
    }
  });

  // Admin notification (if cancelled by user)
  if (cancelledBy === 'user') {
    await createNotification({
      userId: 'admin',
      type: NOTIFICATION_TYPES.ORDER_CANCELLED,
      title: '❌ Order Cancelled by Customer',
      message: `Order #${shortOrderId} cancelled by ${customerName}.${reason ? ` Reason: ${reason}` : ''}`,
      relatedId: order._id.toString(),
      relatedType: 'order',
      isAdmin: true,
      actionUrl: `/admin/orders/${order._id}`,
      metadata: {
        orderId: order._id.toString(),
        customerName: customerName,
        reason,
        amount: order.amount
      }
    });
  }

  console.log(`🔔 Order cancelled notifications sent for order ${order._id}`);
};

// 🆕 Send Order Status Update Notification
const sendOrderStatusUpdateNotification = async (order, oldStatus, newStatus) => {
  const statusMessages = {
    'Processing': 'is being processed',
    'Shipped': 'has been shipped',
    'Out for delivery': 'is out for delivery',
    'Delivered': 'has been delivered successfully! 🎉',
    'Cancelled': 'has been cancelled'
  };

  const message = statusMessages[newStatus] || `status changed to ${newStatus}`;
  const shortOrderId = order._id.toString().slice(-6);

  await createNotification({
    userId: order.userId,
    type: NOTIFICATION_TYPES.ORDER_STATUS_UPDATED,
    title: '📦 Order Status Updated',
    message: `Your order #${shortOrderId} ${message}.`,
    relatedId: order._id.toString(),
    relatedType: 'order',
    actionUrl: `/orders/${order._id}`,
    metadata: {
      orderId: order._id.toString(),
      oldStatus,
      newStatus,
      amount: order.amount
    }
  });

  console.log(`🔔 Order status update notification sent for order ${order._id}`);
};

// 🆕 Send New Comment Notification
const sendNewCommentNotification = async (comment) => {
  let targetName = '';
  let targetType = '';
  let actionUrl = '';

  if (comment.targetType === 'product') {
    targetName = comment.productName || 'Product';
    targetType = 'product';
    actionUrl = `/product/${comment.productId}`;
  } else if (comment.targetType === 'deal') {
    targetName = comment.dealName || 'Deal';
    targetType = 'deal';
    actionUrl = `/deal/${comment.dealId}`;
  }

  // Admin notification for new comment
  await createNotification({
    userId: 'admin',
    type: NOTIFICATION_TYPES.NEW_COMMENT,
    title: '💬 New Comment Received',
    message: `New comment on ${targetType} "${targetName}" by ${comment.author}`,
    relatedId: comment._id.toString(),
    relatedType: 'comment',
    isAdmin: true,
    actionUrl: `/admin/comments`,
    priority: 'medium',
    metadata: {
      commentId: comment._id.toString(),
      author: comment.author,
      targetType: comment.targetType,
      targetName: targetName,
      content: comment.content.substring(0, 100) + '...'
    }
  });

  console.log(`🔔 New comment notification sent for ${targetType}`);
};

// 🆕 Send Comment Reply Notification
const sendCommentReplyNotification = async (comment, replyAuthor) => {
  if (comment.userId) {
    await createNotification({
      userId: comment.userId.toString(),
      type: NOTIFICATION_TYPES.COMMENT_REPLY,
      title: '↩️ Reply to Your Comment',
      message: `${replyAuthor} replied to your comment on ${comment.targetType}`,
      relatedId: comment._id.toString(),
      relatedType: 'comment',
      actionUrl: comment.targetType === 'product' ? `/product/${comment.productId}` : `/deal/${comment.dealId}`,
      metadata: {
        commentId: comment._id.toString(),
        replyAuthor: replyAuthor,
        targetType: comment.targetType,
        originalComment: comment.content.substring(0, 50) + '...'
      }
    });

    console.log(`🔔 Comment reply notification sent to user ${comment.userId}`);
  }
};

// 🆕 Send Low Stock Notification
const sendLowStockNotification = async (product) => {
  await createNotification({
    userId: 'admin',
    type: NOTIFICATION_TYPES.LOW_STOCK,
    title: '⚠️ Low Stock Alert',
    message: `Product "${product.name}" is running low. Current stock: ${product.quantity}`,
    relatedId: product._id.toString(),
    relatedType: 'product',
    isAdmin: true,
    actionUrl: `/admin/products`,
    priority: 'high',
    metadata: {
      productId: product._id.toString(),
      productName: product.name,
      currentStock: product.quantity,
      idealStock: product.idealStock || 20
    }
  });

  console.log(`🔔 Low stock notification sent for product ${product.name}`);
};

// 🆕 UPDATED: placeOrder function with CUSTOMER DETAILS SUPPORT
const placeOrder = async (req, res) => {
  try {
    console.log("🛒 ========== BACKEND ORDER PLACEMENT ==========");
    
    const { items, amount, address, deliveryCharges, customerDetails } = req.body;
    const userId = req.userId;

    // Validate required fields
    if (!items || items.length === 0) {
      return res.json({ success: false, message: "No items in order" });
    }

    if (!amount || amount <= 0) {
      return res.json({ success: false, message: "Invalid order amount" });
    }

    if (!address) {
      return res.json({ success: false, message: "Address is required" });
    }

    // 🆕 GET USER PROFILE DATA FOR DEFAULTS
    const userProfile = await userModel.findById(userId);
    if (!userProfile) {
      return res.json({ success: false, message: "User not found" });
    }

    // 🆕 VALIDATE AND SET CUSTOMER DETAILS
    let finalCustomerDetails = {
      name: userProfile.name, // Default from profile
      email: userProfile.email, // Default from profile
      phone: userProfile.phone || '' // Default from profile
    };

    // Override with provided customer details if available
    if (customerDetails) {
      if (customerDetails.name && customerDetails.name.trim() !== '') {
        finalCustomerDetails.name = customerDetails.name.trim();
      }
      
      if (customerDetails.email && customerDetails.email.trim() !== '') {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerDetails.email.trim())) {
          return res.json({ success: false, message: "Invalid email format" });
        }
        finalCustomerDetails.email = customerDetails.email.trim();
      }
      
      if (customerDetails.phone) {
        finalCustomerDetails.phone = customerDetails.phone;
      }
    }

    console.log("👤 CUSTOMER DETAILS FOR ORDER:", {
      defaultFromProfile: {
        name: userProfile.name,
        email: userProfile.email,
        phone: userProfile.phone
      },
      providedDetails: customerDetails,
      finalDetails: finalCustomerDetails
    });

    // Check stock availability
    console.log("📦 Checking stock availability...");
    const validatedItems = [];
    
    for (const item of items) {
      let product;
      
      // ✅ IMPROVED PRODUCT LOOKUP - Handle both direct products and deal products
      console.log(`🔍 Processing item:`, {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        isFromDeal: item.isFromDeal || false,
        dealName: item.dealName,
        dealImage: item.dealImage,
        dealDescription: item.dealDescription
      });

      // Try multiple ID fields for product lookup
      if (item.id) {
        product = await productModel.findById(item.id);
        console.log(`🔍 Lookup by item.id (${item.id}):`, product ? `Found: ${product.name}` : 'Not found');
      }
      
      if (!product && item._id) {
        product = await productModel.findById(item._id);
        console.log(`🔍 Lookup by item._id (${item._id}):`, product ? `Found: ${product.name}` : 'Not found');
      }
      
      if (!product && item.productId) {
        product = await productModel.findById(item.productId);
        console.log(`🔍 Lookup by item.productId (${item.productId}):`, product ? `Found: ${product.name}` : 'Not found');
      }
      
      // If still no product found by ID, try name lookup as fallback
      if (!product && item.name) {
        product = await productModel.findOne({ 
          name: item.name, 
          status: 'published' 
        });
        console.log(`🔍 Lookup by name (${item.name}):`, product ? `Found: ${product.name}` : 'Not found');
      }

      // If product is still not found and it's from a deal, be more lenient
      if (!product && item.isFromDeal) {
        console.log(`⚠️ Deal product "${item.name}" not found, but continuing order`);
        // Continue with order but use the item data as-is
        validatedItems.push({
          ...item,
          id: item.id || item._id, // Use the original ID
          name: item.name
        });
        continue;
      }

      // If product is not found and not from deal, return error
      if (!product) {
        console.log(`❌ Product not found: ${item.name}`, item);
        return res.json({ success: false, message: `Product "${item.name}" not found` });
      }

      // Validate product status
      if (product.status !== 'published') {
        console.log(`❌ Product not available: ${product.name} (status: ${product.status})`);
        return res.json({ success: false, message: `Product "${product.name}" is not available` });
      }

      // Validate stock
      if (product.quantity < item.quantity) {
        console.log(`❌ Insufficient stock: ${product.name} (available: ${product.quantity}, requested: ${item.quantity})`);
        return res.json({ success: false, message: `Insufficient stock for "${product.name}". Available: ${product.quantity}, Requested: ${item.quantity}` });
      }

      console.log(`✅ Validated product: ${product.name}, Qty: ${item.quantity}, Stock: ${product.quantity}`);

      validatedItems.push({
        ...item,
        id: product._id.toString(), // Ensure consistent ID field
        name: product.name, // Use actual product name from database
        actualProduct: product
      });
    }

    console.log(`📦 Validated ${validatedItems.length} items for order`);

    // Reduce inventory quantity
    console.log("📦 Reducing inventory quantity...");
    for (const validatedItem of validatedItems) {
      // Skip inventory reduction for items that weren't found in database (deal items)
      if (!validatedItem.actualProduct) {
        console.log(`⚠️ Skipping inventory reduction for: ${validatedItem.name} (no product found in DB)`);
        continue;
      }

      const updateResult = await productModel.findByIdAndUpdate(
        validatedItem.id,
        { 
          $inc: { 
            quantity: -validatedItem.quantity,
            totalSales: validatedItem.quantity
          } 
        },
        { new: true }
      );
      
      if (updateResult) {
        console.log(`✅ Reduced stock for ${updateResult.name} by ${validatedItem.quantity}. New stock: ${updateResult.quantity}`);
        
        // Check for low stock and send notification
        if (updateResult.quantity <= 10 && updateResult.quantity > 0) {
          await sendLowStockNotification(updateResult);
        }
        
        // Check for out of stock
        if (updateResult.quantity === 0) {
          await createNotification({
            userId: 'admin',
            type: NOTIFICATION_TYPES.OUT_OF_STOCK,
            title: '🛑 Out of Stock Alert',
            message: `Product "${updateResult.name}" is now out of stock.`,
            relatedId: updateResult._id.toString(),
            relatedType: 'product',
            isAdmin: true,
            actionUrl: `/admin/products`,
            priority: 'urgent',
            metadata: {
              productId: updateResult._id.toString(),
              productName: updateResult.name
            }
          });
        }
      }
    }

    // ✅ ENHANCED: Create order with CUSTOMER DETAILS & DEAL DATA SUPPORT
    const orderData = {
      userId,
      items: validatedItems.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image || item.actualProduct?.image?.[0], // Product image
        category: item.category || item.actualProduct?.category,
        isFromDeal: item.isFromDeal || false,
        dealName: item.dealName || null,
        dealImage: item.dealImage || null, // ✅ DEAL IMAGE INCLUDED
        dealDescription: item.dealDescription || null // ✅ DEAL DESCRIPTION INCLUDED
      })),
      amount: Number(amount),
      address,
      deliveryCharges: deliveryCharges || 0,
      paymentMethod: "COD",
      payment: false,
      status: "Order Placed",
      date: Date.now(),
      customerDetails: finalCustomerDetails // 🆕 INCLUDING CUSTOMER DETAILS
    };

    console.log("📝 FINAL ORDER DATA SAVED:", {
      totalItems: orderData.items.length,
      customerDetails: orderData.customerDetails,
      dealItems: orderData.items.filter(item => item.isFromDeal).length,
      regularItems: orderData.items.filter(item => !item.isFromDeal).length
    });

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    console.log(`✅ Order created: ${newOrder._id} with customer: ${newOrder.customerDetails.name}`);

    // Clear user cart
    await userModel.findByIdAndUpdate(userId, { 
      cartData: {},
      cartDeals: {} 
    });

    console.log(`✅ Cleared cart for user: ${userId}`);

    // 🆕 SEND ORDER PLACED NOTIFICATION (UPDATED TO USE CUSTOMER DETAILS)
    await sendOrderPlacedNotification(newOrder);

    res.json({ 
      success: true, 
      message: "Order Placed Successfully", 
      orderId: newOrder._id,
      deliveryCharges: newOrder.deliveryCharges,
      customerDetails: newOrder.customerDetails // 🆕 Return customer details
    });

  } catch (error) {
    console.error("❌ Error in placeOrder:", error);
    res.json({ success: false, message: error.message });
  }
};

// 📋 Get All Orders (Admin Panel)
const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({}).sort({ date: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    console.error("❌ Error in allOrders:", error);
    res.json({ success: false, message: error.message });
  }
};

// 👤 Get Logged-in User Orders
const userOrders = async (req, res) => {
  try {
    const userId = req.userId;
    const orders = await orderModel.find({ userId }).sort({ date: -1 });
    
    // Enhanced logging for debugging deal images and customer details
    console.log("📦 USER ORDERS RETRIEVED - DEBUG:", {
      totalOrders: orders.length,
      orders: orders.map(order => ({
        id: order._id,
        totalItems: order.items.length,
        customerDetails: order.customerDetails, // 🆕 Log customer details
        dealItems: order.items.filter(item => item.isFromDeal).map(item => ({
          name: item.name,
          isFromDeal: item.isFromDeal,
          dealName: item.dealName,
          dealImage: item.dealImage,
          productImage: item.image,
          hasDealImage: !!item.dealImage,
          hasProductImage: !!item.image
        })),
        regularItems: order.items.filter(item => !item.isFromDeal).length
      }))
    });
    
    res.json({ success: true, orders });
  } catch (error) {
    console.error("❌ Error in userOrders:", error);
    res.json({ success: false, message: error.message });
  }
};

// 🆕 Get Order Details with Customer Information
const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Check if user owns this order or is admin
    if (order.userId !== userId && userId !== 'admin') {
      return res.json({ success: false, message: "Unauthorized to view this order" });
    }

    res.json({ 
      success: true, 
      order,
      // Include customer details prominently
      customerDetails: order.customerDetails
    });

  } catch (error) {
    console.error("❌ Error in getOrderDetails:", error);
    res.json({ success: false, message: error.message });
  }
};

// 🔄 Update Order Status (Admin Panel) with notifications
const updateStatus = async (req, res) => {
  try {
    const { orderId, status, cancellationReason } = req.body;
    
    if (!orderId || !status) {
      return res.json({ success: false, message: "Order ID and status are required" });
    }

    // Find the current order first
    const currentOrder = await orderModel.findById(orderId);
    if (!currentOrder) {
      return res.json({ success: false, message: "Order not found" });
    }

    const oldStatus = currentOrder.status;
    const updateData = { 
      status, 
      updatedAt: new Date() 
    };

    // If cancelling order, add cancellation details and restore inventory
    if (status === "Cancelled" && currentOrder.status !== "Cancelled") {
      updateData.cancellationReason = cancellationReason || "Cancelled by admin";
      updateData.cancelledAt = new Date();
      updateData.cancelledBy = "admin";

      // Restore inventory for items that have actual products
      console.log("📦 Restoring inventory quantity for cancelled order...");
      for (const item of currentOrder.items) {
        // Only restore inventory for items that were actually reduced
        if (item.id) {
          await productModel.findByIdAndUpdate(
            item.id,
            { 
              $inc: { 
                quantity: item.quantity,
                totalSales: -item.quantity
              } 
            }
          );
          console.log(`✅ Restored stock for item: ${item.name}, Qty: ${item.quantity}`);
        }
      }

      // 🆕 SEND ORDER CANCELLED NOTIFICATION (UPDATED)
      await sendOrderCancelledNotification(currentOrder, 'admin', cancellationReason);
    }

    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderId, 
      updateData, 
      { new: true }
    );

    if (!updatedOrder) {
      return res.json({ success: false, message: "Order not found" });
    }

    // 🆕 SEND STATUS UPDATE NOTIFICATION (if status changed)
    if (oldStatus !== status && status !== "Cancelled") {
      await sendOrderStatusUpdateNotification(updatedOrder, oldStatus, status);
    }

    res.json({ 
      success: true, 
      message: "Order status updated successfully",
      order: updatedOrder 
    });

  } catch (error) {
    console.error("❌ Error in updateStatus:", error);
    res.json({ success: false, message: error.message });
  }
};

// ❌ Cancel Order (User) with notifications
const cancelOrder = async (req, res) => {
  try {
    const { orderId, cancellationReason } = req.body;
    const userId = req.userId;

    if (!orderId) {
      return res.json({ success: false, message: "Order ID is required" });
    }

    if (!cancellationReason || cancellationReason.trim() === "") {
      return res.json({ success: false, message: "Cancellation reason is required" });
    }

    // Find the order
    const order = await orderModel.findById(orderId);
    
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Check if user owns this order
    if (order.userId !== userId) {
      return res.json({ success: false, message: "Unauthorized to cancel this order" });
    }

    // Check if order can be cancelled
    const nonCancellableStatuses = ["Shipped", "Out for delivery", "Delivered", "Cancelled"];
    if (nonCancellableStatuses.includes(order.status)) {
      return res.json({ 
        success: false, 
        message: `Order cannot be cancelled as it is already ${order.status.toLowerCase()}` 
      });
    }

    // Restore inventory if order was placed
    if (order.status === "Order Placed" || order.status === "Processing") {
      console.log("📦 Restoring inventory quantity...");
      for (const item of order.items) {
        // Only restore inventory for items that have valid product IDs
        if (item.id) {
          await productModel.findByIdAndUpdate(
            item.id,
            { 
              $inc: { 
                quantity: item.quantity,
                totalSales: -item.quantity
              } 
            }
          );
          console.log(`✅ Restored stock for: ${item.name}, Qty: ${item.quantity}`);
        }
      }
    }

    // Update order status and cancellation details
    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderId,
      { 
        status: "Cancelled",
        cancellationReason: cancellationReason.trim(),
        cancelledAt: new Date(),
        cancelledBy: "user",
        updatedAt: new Date()
      },
      { new: true }
    );

    // 🆕 SEND ORDER CANCELLED NOTIFICATION (UPDATED)
    await sendOrderCancelledNotification(updatedOrder, 'user', cancellationReason);

    res.json({ 
      success: true, 
      message: "Order cancelled successfully",
      order: updatedOrder 
    });

  } catch (error) {
    console.error("❌ Error in cancelOrder:", error);
    res.json({ success: false, message: error.message });
  }
};

// 🆕 NOTIFICATION CONTROLLER FUNCTIONS

// Get user notifications
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 20 } = req.query;

    const notifications = await notificationModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .exec();

    const unreadCount = await notificationModel.countDocuments({ 
      userId, 
      isRead: false 
    });

    res.json({
      success: true,
      notifications,
      unreadCount
    });

  } catch (error) {
    console.error("❌ Error in getUserNotifications:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get admin notifications
const getAdminNotifications = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const notifications = await notificationModel
      .find({ isAdmin: true })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .exec();

    const unreadCount = await notificationModel.countDocuments({ 
      isAdmin: true, 
      isRead: false 
    });

    res.json({
      success: true,
      notifications,
      unreadCount
    });

  } catch (error) {
    console.error("❌ Error in getAdminNotifications:", error);
    res.json({ success: false, message: error.message });
  }
};

// Mark notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.body;
    const userId = req.userId;

    const notification = await notificationModel.findOne({ 
      _id: notificationId, 
      userId 
    });

    if (!notification) {
      return res.json({ success: false, message: "Notification not found" });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      message: "Notification marked as read"
    });

  } catch (error) {
    console.error("❌ Error in markNotificationAsRead:", error);
    res.json({ success: false, message: error.message });
  }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.userId;

    await notificationModel.updateMany(
      { userId, isRead: false },
      { 
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      message: "All notifications marked as read"
    });

  } catch (error) {
    console.error("❌ Error in markAllNotificationsAsRead:", error);
    res.json({ success: false, message: error.message });
  }
};

// 🆕 Get Cancellation Reasons
const getCancellationReasons = async (req, res) => {
  try {
    const cancellationReasons = [
      "Changed my mind",
      "Found better price elsewhere",
      "Delivery time too long",
      "Ordered by mistake",
      "Product not required anymore",
      "Payment issues",
      "Duplicate order",
      "Shipping address issues",
      "Other"
    ];

    res.json({ success: true, cancellationReasons });
  } catch (error) {
    console.error("❌ Error in getCancellationReasons:", error);
    res.json({ success: false, message: error.message });
  }
};

// 🆕 Check Stock
const checkStock = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    const product = await productModel.findById(productId);
    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }
    
    if (product.quantity < quantity) {
      return res.json({ 
        success: false, 
        message: `Only ${product.quantity} items available`,
        availableQuantity: product.quantity
      });
    }
    
    res.json({ 
      success: true, 
      message: "Product available",
      availableQuantity: product.quantity
    });
    
  } catch (error) {
    console.error("❌ Error in checkStock:", error);
    res.json({ success: false, message: error.message });
  }
};

export { 
  placeOrder, 
  allOrders, 
  userOrders, 
  getOrderDetails, // 🆕 Export the new function
  updateStatus, 
  cancelOrder,
  getCancellationReasons,
  checkStock,
  // Notification functions
  getUserNotifications,
  getAdminNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
};