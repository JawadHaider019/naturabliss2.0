import { v2 as cloudinary } from 'cloudinary';
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import notificationModel from "../models/notifcationModel.js";
import Comment from "../models/commentModel.js";
import couponModel from "../models/couponModel.js";

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

// 🆕 Send Order Placed Notification with Customer Details
const sendOrderPlacedNotification = async (order) => {
  const shortOrderId = order._id.toString().slice(-6);
  
  const customerName = order.customerDetails?.name || 'Customer';
  const customerEmail = order.customerDetails?.email || '';
  
  // Send notification to order owner if they have userId (logged-in users)
  if (order.userId) {
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
  }

  // Admin notification
  await createNotification({
    userId: 'admin',
    type: NOTIFICATION_TYPES.ORDER_PLACED,
    title: order.isGuest ? '🛒 New Guest Order' : '🛒 New Order',
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
      itemsCount: order.items.length,
      isGuest: order.isGuest
    }
  });

  console.log(`🔔 Order placed notifications sent for order ${order._id}`);
};

// 🆕 Send Order Cancelled Notification with Customer Details
const sendOrderCancelledNotification = async (order, cancelledBy, reason = '') => {
  const shortOrderId = order._id.toString().slice(-6);
  const cancelledByText = cancelledBy === 'user' ? 'You have' : 'Admin has';
  
  const customerName = order.customerDetails?.name || 'Customer';
  
  if (order.userId) {
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
  }

  if (cancelledBy === 'user' || order.isGuest) {
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
        amount: order.amount,
        isGuest: order.isGuest
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

  if (order.userId) {
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
  }

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

// 🆕 Helper function for product validation and stock check
const validateAndProcessItems = async (items) => {
  const validatedItems = [];
  
  for (const item of items) {
    let product;
    
    if (item.id) {
      product = await productModel.findById(item.id);
    }
    
    if (!product && item._id) {
      product = await productModel.findById(item._id);
    }
    
    if (!product && item.productId) {
      product = await productModel.findById(item.productId);
    }
    
    if (!product && item.name) {
      product = await productModel.findOne({ 
        name: item.name, 
        status: 'published' 
      });
    }

    if (!product && item.isFromDeal) {
      console.log(`⚠️ Deal product "${item.name}" not found, but continuing order`);
      validatedItems.push({
        ...item,
        id: item.id || item._id,
        name: item.name
      });
      continue;
    }

    if (!product) {
      throw new Error(`Product "${item.name}" not found`);
    }

    if (product.status !== 'published') {
      throw new Error(`Product "${product.name}" is not available`);
    }

    if (product.quantity < item.quantity) {
      throw new Error(`Insufficient stock for "${product.name}". Available: ${product.quantity}, Requested: ${item.quantity}`);
    }

    validatedItems.push({
      ...item,
      id: product._id.toString(),
      name: product.name,
      actualProduct: product
    });
  }
  
  return validatedItems;
};

// 🆕 Helper function to reduce inventory
const reduceInventory = async (validatedItems) => {
  for (const validatedItem of validatedItems) {
    if (!validatedItem.actualProduct) continue;

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
      
      if (updateResult.quantity <= 10 && updateResult.quantity > 0) {
        await sendLowStockNotification(updateResult);
      }
      
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
          priority: 'urgent'
        });
      }
    }
  }
};

// 🆕 MAIN ORDER PLACEMENT FUNCTION (Handles both logged-in and guest users with Advance Payment Proof)
const placeOrder = async (req, res) => {
  try {
    console.log("🛒 ========== ORDER PLACEMENT ==========");
    
    const body = req.body || {};
    let { 
      items, 
      amount, 
      address, 
      deliveryCharges, 
      customerDetails,
      paymentScreenshot,
      advanceAmount,
      transactionId,
      advancePaymentNote,
      couponCode,
      couponDiscount
    } = body;
    
    // Parse JSON fields if sent via FormData
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch(e) {}
    }
    if (typeof address === 'string') {
      try { address = JSON.parse(address); } catch(e) {}
    }
    if (typeof customerDetails === 'string') {
      try { customerDetails = JSON.parse(customerDetails); } catch(e) {}
    }

    // Handle uploaded payment screenshot file
    let screenshotUrl = paymentScreenshot || "";
    const screenshotFile = req.file || (req.files && (
      (Array.isArray(req.files) ? req.files.find(f => f.fieldname === 'paymentScreenshot' || f.fieldname === 'screenshot') : req.files.paymentScreenshot?.[0])
    ));

    if (screenshotFile) {
      try {
        const uploadRes = await cloudinary.uploader.upload(screenshotFile.path, {
          resource_type: "image",
          folder: "payment_proofs"
        });
        screenshotUrl = uploadRes.secure_url;
        console.log("✅ Payment screenshot uploaded to Cloudinary:", screenshotUrl);
      } catch (uploadErr) {
        console.error("❌ Error uploading payment screenshot:", uploadErr);
      }
    }
    
    // 🆕 IMPORTANT: req.userId will be undefined for guests
    let userId = null;
    if (req.headers.token) {
      userId = req.userId;
    }
    
    const isGuest = !userId;

    console.log("👤 User info for order:", {
      userId: userId || 'undefined (guest)',
      isGuest: isGuest,
      hasToken: !!req.headers.token,
      hasScreenshot: !!screenshotUrl
    });

    // Basic validations
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "No items in order" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid order amount" });
    }

    if (!address) {
      return res.status(400).json({ success: false, message: "Address is required" });
    }

    // Customer details validation
    if (!customerDetails || !customerDetails.name || !customerDetails.email || !customerDetails.phone) {
      return res.status(400).json({ 
        success: false, 
        message: "Customer details (name, email, phone) are required" 
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerDetails.email.trim())) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    const phoneDigits = customerDetails.phone.replace(/\D/g, '');
    if (!/^03\d{9}$/.test(phoneDigits)) {
      return res.status(400).json({ 
        success: false, 
        message: "Please enter a valid Pakistani phone number (03XXXXXXXXX)" 
      });
    }

    // Validate items and check stock
    console.log("📦 Checking stock availability...");
    const validatedItems = await validateAndProcessItems(items);
    console.log(`✅ Validated ${validatedItems.length} items for order`);

    // Reduce inventory
    console.log("📦 Reducing inventory quantity...");
    await reduceInventory(validatedItems);

    const deliveryFee = Number(deliveryCharges !== undefined && deliveryCharges !== null ? deliveryCharges : 250);
    const advanceFee = Number(advanceAmount || deliveryFee || 250);

    // Create order data
    const orderData = {
      userId: userId || null,
      items: validatedItems.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image || item.actualProduct?.image?.[0],
        category: item.category || item.actualProduct?.category,
        isFromDeal: item.isFromDeal || false,
        dealName: item.dealName || null,
        dealImage: item.dealImage || null,
        dealDescription: item.dealDescription || null
      })),
      amount: Number(amount),
      address,
      deliveryCharges: deliveryFee,
      paymentMethod: "COD (Advance Delivery Paid)",
      payment: false,
      paymentScreenshot: screenshotUrl,
      advanceAmount: advanceFee,
      advancePaymentStatus: screenshotUrl ? "pending" : "pending",
      transactionId: transactionId || "",
      advancePaymentNote: advancePaymentNote || "",
      couponCode: couponCode ? String(couponCode).toUpperCase().trim() : "",
      couponDiscount: Number(couponDiscount) || 0,
      status: "Pending",
      date: Date.now(),
      customerDetails: {
        name: customerDetails.name.trim(),
        email: customerDetails.email.trim(),
        phone: customerDetails.phone
      },
      isGuest: isGuest
    };

    // Increment coupon used count if coupon applied
    if (orderData.couponCode) {
      try {
        await couponModel.findOneAndUpdate(
          { code: orderData.couponCode },
          { $inc: { usedCount: 1 } }
        );
      } catch (couponErr) {
        console.error("Error updating coupon used count:", couponErr);
      }
    }

    console.log("📝 ORDER DATA SAVED:", {
      userId: orderData.userId,
      isGuest: orderData.isGuest,
      customerName: orderData.customerDetails.name,
      totalItems: orderData.items.length,
      screenshot: !!orderData.paymentScreenshot
    });

    // Save order
    const newOrder = new orderModel(orderData);
    await newOrder.save();

    console.log(`✅ Order created: ${newOrder._id} for ${isGuest ? 'Guest' : 'User'}: ${newOrder.customerDetails.name}`);

    // Clear cart only for logged-in users
    if (userId) {
      await userModel.findByIdAndUpdate(userId, { 
        cartData: {},
        cartDeals: {} 
      });
      console.log(`✅ Cleared cart for logged-in user: ${userId}`);
    }

    // Send notifications
    await sendOrderPlacedNotification(newOrder);

    res.json({ 
      success: true, 
      message: "Order Placed Successfully", 
      orderId: newOrder._id,
      deliveryCharges: newOrder.deliveryCharges,
      customerDetails: newOrder.customerDetails,
      isGuest: isGuest
    });

  } catch (error) {
    console.error("❌ Error in placeOrder:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to place order" 
    });
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
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Please login to view your orders" 
      });
    }
    
    const orders = await orderModel.find({ userId }).sort({ date: -1 });
    
    console.log("📦 USER ORDERS RETRIEVED:", {
      userId: userId,
      totalOrders: orders.length
    });
    
    res.json({ success: true, orders });
  } catch (error) {
    console.error("❌ Error in userOrders:", error);
    res.json({ success: false, message: error.message });
  }
};

// 🆕 Get Guest Orders by Email/Phone - Match EITHER email OR phone
const getGuestOrders = async (req, res) => {
  try {
    const { email, phone } = req.body;
    
    if (!email && !phone) {
      return res.json({ 
        success: false, 
        message: "Email or phone is required to find guest orders" 
      });
    }
    
    // Build OR conditions array
    let orConditions = [];
    
    if (email) {
      orConditions.push({ 
        'customerDetails.email': email.trim().toLowerCase() 
      });
    }
    
    if (phone) {
      const phoneDigits = phone.replace(/\D/g, '');
      orConditions.push({ 
        'customerDetails.phone': { 
          $regex: phoneDigits, 
          $options: 'i' 
        } 
      });
    }
    
    // Query with OR condition
    const query = {
      isGuest: true,
      $or: orConditions
    };
    
    const orders = await orderModel.find(query).sort({ date: -1 });
    
    // Return full order details including category and subcategory
    const safeOrders = orders.map(order => ({
      _id: order._id,
      items: order.items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
        category: item.category,
        subcategory: item.subcategory,
        isFromDeal: item.isFromDeal || false,
        dealName: item.dealName,
        dealImage: item.dealImage,
        originalTotalPrice: item.originalTotalPrice,
        savings: item.savings,
        description: item.description
      })),
      amount: order.amount,
      status: order.status,
      date: order.date,
      deliveryCharges: order.deliveryCharges,
      address: order.address,
      customerDetails: {
        name: order.customerDetails?.name || '',
        email: order.customerDetails?.email || '',
        phone: order.customerDetails?.phone || ''
      },
      paymentMethod: order.paymentMethod,
      payment: order.payment,
      paymentScreenshot: order.paymentScreenshot || '',
      advanceAmount: order.advanceAmount || 250,
      advancePaymentStatus: order.advancePaymentStatus || 'pending',
      transactionId: order.transactionId || '',
      advancePaymentNote: order.advancePaymentNote || '',
      isGuest: true
    }));
    
    res.json({ 
      success: true, 
      orders: safeOrders,
      count: orders.length 
    });
    
  } catch (error) {
    console.error("❌ Error in getGuestOrders:", error);
    res.json({ success: false, message: error.message });
  }
};

// 🆕 Get Order Details (Updated for guests)
const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Check if user is authorized to view this order
    const isAdmin = userId === 'admin';
    const isOwner = order.userId && order.userId.toString() === userId;
    const isGuestOrder = order.isGuest;
    
    // For guest orders, we need to verify via email/phone
    if (!isAdmin && !isOwner && isGuestOrder) {
      // Guest users need to verify with email/phone
      // This should be handled by a separate guest verification endpoint
      return res.json({ 
        success: false, 
        message: "Please verify your email/phone to view this guest order" 
      });
    }
    
    if (!isAdmin && !isOwner) {
      return res.json({ 
        success: false, 
        message: "Unauthorized to view this order" 
      });
    }

    res.json({ 
      success: true, 
      order,
      customerDetails: order.customerDetails
    });

  } catch (error) {
    console.error("❌ Error in getOrderDetails:", error);
    res.json({ success: false, message: error.message });
  }
};

// 🆕 NEW: Get Guest Order Details by Email/Phone Verification
const getGuestOrderDetails = async (req, res) => {
  try {
    const { orderId, email, phone } = req.body;
    
    if (!orderId) {
      return res.json({ success: false, message: "Order ID is required" });
    }
    
    if (!email && !phone) {
      return res.json({ 
        success: false, 
        message: "Email or phone is required to verify guest order" 
      });
    }
    
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }
    
    if (!order.isGuest) {
      return res.json({ 
        success: false, 
        message: "This is not a guest order" 
      });
    }
    
    // Verify with email
    if (email && order.customerDetails.email.toLowerCase() !== email.trim().toLowerCase()) {
      return res.json({ 
        success: false, 
        message: "Email does not match this order" 
      });
    }
    
    // Verify with phone (last 4 digits for privacy)
    if (phone) {
      const orderPhoneDigits = order.customerDetails.phone.replace(/\D/g, '');
      const inputPhoneDigits = phone.replace(/\D/g, '');
      
      if (!orderPhoneDigits.includes(inputPhoneDigits.slice(-4))) {
        return res.json({ 
          success: false, 
          message: "Phone number does not match this order" 
        });
      }
    }
    
    // Return order details (hide sensitive info)
    const safeOrder = {
      _id: order._id,
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image
      })),
      amount: order.amount,
      status: order.status,
      date: order.date,
      deliveryCharges: order.deliveryCharges,
      address: {
        street: order.address.street,
        city: order.address.city,
        state: order.address.state,
        zipcode: order.address.zipcode
      },
      customerDetails: {
        name: order.customerDetails.name,
      },
      isGuest: true
    };
    
    res.json({ 
      success: true, 
      order: safeOrder
    });

  } catch (error) {
    console.error("❌ Error in getGuestOrderDetails:", error);
    res.json({ success: false, message: error.message });
  }
};

// 🔄 Update Order Status (Admin Panel)
const updateStatus = async (req, res) => {
  try {
    const { orderId, status, cancellationReason } = req.body;
    
    if (!orderId || !status) {
      return res.json({ success: false, message: "Order ID and status are required" });
    }

    const currentOrder = await orderModel.findById(orderId);
    if (!currentOrder) {
      return res.json({ success: false, message: "Order not found" });
    }

    const oldStatus = currentOrder.status;
    const updateData = { 
      status, 
      updatedAt: new Date() 
    };

    if (status === "Cancelled" && currentOrder.status !== "Cancelled") {
      updateData.cancellationReason = cancellationReason || "Cancelled by admin";
      updateData.cancelledAt = new Date();
      updateData.cancelledBy = "admin";

      console.log("📦 Restoring inventory quantity for cancelled order...");
      for (const item of currentOrder.items) {
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

    if (oldStatus !== status && status !== "Cancelled" && updatedOrder.userId) {
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

// ❌ Cancel Order (User)
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

    const order = await orderModel.findById(orderId);
    
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Check authorization
    if (order.userId && order.userId.toString() !== userId) {
      return res.json({ success: false, message: "Unauthorized to cancel this order" });
    }

    const nonCancellableStatuses = ["Shipped", "Out for delivery", "Delivered", "Cancelled"];
    if (nonCancellableStatuses.includes(order.status)) {
      return res.json({ 
        success: false, 
        message: `Order cannot be cancelled as it is already ${order.status.toLowerCase()}` 
      });
    }

    if (order.status === "Order Placed" || order.status === "Processing") {
      console.log("📦 Restoring inventory quantity...");
      for (const item of order.items) {
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

// 🆕 Cancel Guest Order
const cancelGuestOrder = async (req, res) => {
  try {
    const { orderId, cancellationReason, email, phone } = req.body;

    if (!orderId) {
      return res.json({ success: false, message: "Order ID is required" });
    }

    if (!cancellationReason || cancellationReason.trim() === "") {
      return res.json({ success: false, message: "Cancellation reason is required" });
    }

    if (!email && !phone) {
      return res.json({ 
        success: false, 
        message: "Email or phone is required to cancel guest order" 
      });
    }

    const order = await orderModel.findById(orderId);
    
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    if (!order.isGuest) {
      return res.json({ success: false, message: "This is not a guest order" });
    }

    // Verify guest identity
    let isVerified = false;
    
    if (email && order.customerDetails.email.toLowerCase() === email.trim().toLowerCase()) {
      isVerified = true;
    }
    
    if (phone && !isVerified) {
      const orderPhoneDigits = order.customerDetails.phone.replace(/\D/g, '');
      const inputPhoneDigits = phone.replace(/\D/g, '');
      
      if (orderPhoneDigits.includes(inputPhoneDigits.slice(-4))) {
        isVerified = true;
      }
    }
    
    if (!isVerified) {
      return res.json({ 
        success: false, 
        message: "Unable to verify your identity. Please check your email/phone." 
      });
    }

    const nonCancellableStatuses = ["Shipped", "Out for delivery", "Delivered", "Cancelled"];
    if (nonCancellableStatuses.includes(order.status)) {
      return res.json({ 
        success: false, 
        message: `Order cannot be cancelled as it is already ${order.status.toLowerCase()}` 
      });
    }

    if (order.status === "Order Placed" || order.status === "Processing") {
      console.log("📦 Restoring inventory quantity for guest order...");
      for (const item of order.items) {
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

    await sendOrderCancelledNotification(updatedOrder, 'user', cancellationReason);

    res.json({ 
      success: true, 
      message: "Order cancelled successfully",
      order: updatedOrder 
    });

  } catch (error) {
    console.error("❌ Error in cancelGuestOrder:", error);
    res.json({ success: false, message: error.message });
  }
};

// 🆕 NOTIFICATION CONTROLLER FUNCTONS

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

// 🆕 Admin Verify Advance Payment Proof
const verifyAdvancePayment = async (req, res) => {
  try {
    const { orderId, status, note } = req.body; // status: 'verified' | 'rejected' | 'pending'
    if (!orderId || !status) {
      return res.status(400).json({ success: false, message: "Order ID and status are required" });
    }

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.advancePaymentStatus = status;
    if (status === 'verified') {
      order.payment = true;
      order.status = 'Order Placed'; // Order is officially placed once payment is approved
    } else if (status === 'rejected') {
      order.payment = false;
      order.status = 'Pending';
    }

    if (note) {
      order.advancePaymentNote = note;
    }
    order.updatedAt = Date.now();
    await order.save();

    res.json({ success: true, message: `Advance payment marked as ${status}`, order });
  } catch (error) {
    console.error("❌ Error verifying advance payment:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export { 
  placeOrder, 
  allOrders, 
  userOrders, 
  getOrderDetails,
  getGuestOrderDetails,
  getGuestOrders,
  updateStatus, 
  verifyAdvancePayment,
  cancelOrder,
  cancelGuestOrder,
  getCancellationReasons,
  checkStock,
  getUserNotifications,
  getAdminNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};