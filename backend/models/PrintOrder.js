// ============================================================
// models/PrintOrder.js
// Database model for Physical Notes & Study Material Print Orders
// Supports Local Print Partners, Blinkit, and Zepto delivery
// ============================================================

const mongoose = require('mongoose');

const printOrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    customer: {
      name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true,
      },
      phone: {
        type: String,
        required: [true, 'Customer phone is required'],
        trim: true,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
      address: {
        street: {
          type: String,
          required: [true, 'Delivery street/house address is required'],
          trim: true,
        },
        city: {
          type: String,
          required: [true, 'City is required'],
          trim: true,
        },
        state: {
          type: String,
          default: 'Uttar Pradesh',
          trim: true,
        },
        pincode: {
          type: String,
          required: [true, 'Pincode is required'],
          trim: true,
        },
      },
    },
    document: {
      title: {
        type: String,
        required: [true, 'Document title is required'],
        trim: true,
      },
      resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudyResource',
        default: null,
      },
      fileUrl: {
        type: String,
        default: '',
      },
      classLevel: {
        type: String,
        default: '',
      },
      subject: {
        type: String,
        default: '',
      },
    },
    provider: {
      code: {
        type: String,
        enum: ['LOCAL_PARTNER', 'BLINKIT', 'ZEPTO'],
        default: 'LOCAL_PARTNER',
      },
      name: {
        type: String,
        default: 'Nearby Print Store',
      },
    },
    specifications: {
      copies: {
        type: Number,
        default: 1,
        min: 1,
        max: 50,
      },
      pageRange: {
        type: String,
        default: 'All',
        trim: true,
      },
      pageCount: {
        type: Number,
        default: 10,
        min: 1,
      },
      colorMode: {
        type: String,
        enum: ['BW', 'COLOR'],
        default: 'BW',
      },
      printSides: {
        type: String,
        enum: ['SINGLE', 'DOUBLE'],
        default: 'DOUBLE',
      },
      binding: {
        type: String,
        enum: ['NONE', 'SPIRAL', 'SOFTCOVER'],
        default: 'SPIRAL',
      },
    },
    pricing: {
      printCost: {
        type: Number,
        required: true,
        min: 0,
      },
      bindingCost: {
        type: Number,
        default: 0,
        min: 0,
      },
      deliveryCost: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalAmount: {
        type: Number,
        required: true,
        min: 0,
      },
      currency: {
        type: String,
        default: 'INR',
      },
    },
    payment: {
      method: {
        type: String,
        enum: ['ONLINE', 'COD'],
        default: 'ONLINE',
      },
      status: {
        type: String,
        enum: ['PENDING', 'PAID', 'FAILED', 'COD_VERIFIED'],
        default: 'PENDING',
        index: true,
      },
      razorpayOrderId: {
        type: String,
        default: null,
      },
      razorpayPaymentId: {
        type: String,
        default: null,
      },
      razorpaySignature: {
        type: String,
        default: null,
      },
    },
    status: {
      type: String,
      enum: ['PLACED', 'CONFIRMED', 'PRINTING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
      default: 'PLACED',
      index: true,
    },
    tracking: {
      trackingNumber: {
        type: String,
        default: '',
        trim: true,
      },
      courierPartner: {
        type: String,
        default: 'Local Fast Courier / Partner Delivery',
        trim: true,
      },
      estimatedDelivery: {
        type: Date,
        default: null,
      },
      notes: {
        type: String,
        default: '',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate estimated delivery if not provided
printOrderSchema.pre('save', function (next) {
  if (!this.tracking.estimatedDelivery) {
    const hours = this.provider.code === 'BLINKIT' || this.provider.code === 'ZEPTO' ? 2 : 36;
    this.tracking.estimatedDelivery = new Date(Date.now() + hours * 60 * 60 * 1000);
  }
  next();
});

const PrintOrder = mongoose.model('PrintOrder', printOrderSchema);

module.exports = PrintOrder;
