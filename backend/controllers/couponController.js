import couponModel from "../models/couponModel.js";

// Validate coupon on checkout (Public)
export const validateCoupon = async (req, res) => {
  try {
    const { code, cartAmount } = req.body;

    if (!code || !code.trim()) {
      return res.json({ success: false, message: "Please enter a coupon code" });
    }

    const cleanCode = code.trim().toUpperCase();
    const coupon = await couponModel.findOne({ code: cleanCode });

    if (!coupon) {
      return res.json({ success: false, message: "Invalid promo code" });
    }

    if (!coupon.isActive) {
      return res.json({ success: false, message: "This promo code is currently inactive" });
    }

    // Expiry check
    if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
      return res.json({ success: false, message: "This promo code has expired" });
    }

    // Usage limit check
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.json({ success: false, message: "This promo code has reached its usage limit" });
    }

    const subtotal = Number(cartAmount) || 0;

    // Minimum order amount check
    if (coupon.minOrderAmount > 0 && subtotal < coupon.minOrderAmount) {
      return res.json({
        success: false,
        message: `Minimum order amount for this coupon is Rs. ${coupon.minOrderAmount.toLocaleString()}`,
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount > 0 && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      // Fixed amount discount
      discountAmount = Math.min(coupon.discountValue, subtotal);
    }

    discountAmount = Math.round(discountAmount * 100) / 100;

    return res.json({
      success: true,
      message: "Promo code applied successfully!",
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: discountAmount,
        minOrderAmount: coupon.minOrderAmount,
        description: coupon.description,
      },
    });
  } catch (error) {
    console.error("Validate coupon error:", error);
    return res.json({ success: false, message: error.message });
  }
};

// Add new coupon (Admin)
export const addCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      expiryDate,
      usageLimit,
      isActive,
    } = req.body;

    if (!code || !discountValue) {
      return res.json({ success: false, message: "Code and discount value are required" });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await couponModel.findOne({ code: cleanCode });
    if (existing) {
      return res.json({ success: false, message: "Promo code already exists" });
    }

    const newCoupon = new couponModel({
      code: cleanCode,
      description: description || "",
      discountType: discountType || "percentage",
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscountAmount: Number(maxDiscountAmount) || 0,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      usageLimit: Number(usageLimit) || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    await newCoupon.save();
    return res.json({ success: true, message: "Promo code created successfully", coupon: newCoupon });
  } catch (error) {
    console.error("Add coupon error:", error);
    return res.json({ success: false, message: error.message });
  }
};

// List all coupons (Admin)
export const listCoupons = async (req, res) => {
  try {
    const coupons = await couponModel.find({}).sort({ createdAt: -1 });
    return res.json({ success: true, coupons });
  } catch (error) {
    console.error("List coupons error:", error);
    return res.json({ success: false, message: error.message });
  }
};

// Delete coupon (Admin)
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.json({ success: false, message: "Coupon ID is required" });
    }
    await couponModel.findByIdAndDelete(id);
    return res.json({ success: true, message: "Promo code deleted successfully" });
  } catch (error) {
    console.error("Delete coupon error:", error);
    return res.json({ success: false, message: error.message });
  }
};

// Toggle coupon status (Admin)
export const toggleCouponStatus = async (req, res) => {
  try {
    const { id, isActive } = req.body;
    if (!id) {
      return res.json({ success: false, message: "Coupon ID is required" });
    }
    const coupon = await couponModel.findById(id);
    if (!coupon) {
      return res.json({ success: false, message: "Coupon not found" });
    }

    coupon.isActive = isActive !== undefined ? isActive : !coupon.isActive;
    await coupon.save();

    return res.json({
      success: true,
      message: `Promo code ${coupon.isActive ? "activated" : "deactivated"} successfully`,
      coupon,
    });
  } catch (error) {
    console.error("Toggle coupon status error:", error);
    return res.json({ success: false, message: error.message });
  }
};
