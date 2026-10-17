import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: {
        type: String, 
        required: false,
        default: null
    },
    
    items: {type: Array, required: true},
    amount: {type: Number, required: true},
    address: {type: Object, required: true},
    status: {type: String, required: true, default: "Pending"},
    paymentMethod: {type: String, required: true},
    payment: {type: Boolean, required: true, default: false},
    date: {type: Number, required: true},
    deliveryCharges: {type: Number, required: true, default: 0},
    
    // 🆕 ADD THIS FIELD
    isGuest: { type: Boolean, default: false },
    
    // ORDER-SPECIFIC CUSTOMER DETAILS
    customerDetails: {
        name: {type: String, required: true},
        email: {type: String, required: false, default: ''},
        phone: {type: String, default: ''}
    },

    // 🆕 ADVANCE DELIVERY PAYMENT PROOF
    paymentScreenshot: { type: String, default: "" },
    advanceAmount: { type: Number, default: 0 },
    advancePaymentStatus: { 
        type: String, 
        enum: ['pending', 'verified', 'rejected', 'not_required'], 
        default: 'pending' 
    },
    transactionId: { type: String, default: "" },
    advancePaymentNote: { type: String, default: "" },

    // 🆕 PROMO CODE / DISCOUNT
    couponCode: { type: String, default: "" },
    couponDiscount: { type: Number, default: 0 },

    cancellationReason: {type: String, default: null},
    cancelledAt: {type: Date, default: null},
    cancelledBy: {type: String, default: null},
    
    createdAt: { type: Date, default: Date.now }, 
    updatedAt: { type: Date, default: Date.now }
})

const orderModel =  mongoose.models.order || mongoose.model("orders", orderSchema)
export default orderModel;