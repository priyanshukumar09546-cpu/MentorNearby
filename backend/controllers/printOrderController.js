// ============================================================
// controllers/printOrderController.js
// Handles Print My Notes ordering flow, pricing calculation,
// Razorpay payment verification, COD placement, user tracking & admin management.
// ============================================================

const PrintOrder = require('../models/PrintOrder');
const StudyResource = require('../models/StudyResource');
const razorpayService = require('../services/razorpayService');
const { success, error } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// Helper: Calculate genuine printing pricing
const calculatePrintPrice = ({ pageCount = 10, copies = 1, colorMode = 'BW', printSides = 'DOUBLE', binding = 'SPIRAL' }) => {
  const safePages = Math.max(1, Number(pageCount) || 10);
  const safeCopies = Math.max(1, Math.min(50, Number(copies) || 1));

  let ratePerPage = 2.0; // B&W Single
  if (colorMode === 'COLOR') {
    ratePerPage = printSides === 'DOUBLE' ? 4.5 : 6.0;
  } else {
    ratePerPage = printSides === 'DOUBLE' ? 1.5 : 2.0;
  }

  const printCost = Math.round(safePages * safeCopies * ratePerPage);

  let bindingUnitCost = 0;
  if (binding === 'SPIRAL') bindingUnitCost = 30;
  else if (binding === 'SOFTCOVER') bindingUnitCost = 60;

  const bindingCost = bindingUnitCost * safeCopies;
  const subtotal = printCost + bindingCost;
  const deliveryCost = subtotal >= 299 ? 0 : 40;
  const totalAmount = subtotal + deliveryCost;

  return {
    pageCount: safePages,
    copies: safeCopies,
    ratePerPage,
    printCost,
    bindingCost,
    deliveryCost,
    totalAmount,
  };
};

// ============================================================
// 1. CREATE PRINT ORDER (Razorpay or COD)
// ============================================================
exports.createPrintOrder = asyncHandler(async (req, res, next) => {
  const { customer, document, provider = {}, specifications = {}, paymentMethod = 'ONLINE' } = req.body;
  const userId = req.user ? req.user.id : null;

  if (!customer || !customer.name || !customer.phone || !customer.address || !customer.address.street || !customer.address.city || !customer.address.pincode) {
    return error(res, 'Complete customer name, mobile number, and delivery address are required', 400);
  }

  if (!document || !document.title) {
    return error(res, 'Target document title is required', 400);
  }

  // Calculate pricing server-side
  const pricing = calculatePrintPrice({
    pageCount: specifications.pageCount || 10,
    copies: specifications.copies || 1,
    colorMode: specifications.colorMode || 'BW',
    printSides: specifications.printSides || 'DOUBLE',
    binding: specifications.binding || 'SPIRAL',
  });

  // Generate unique Order ID
  const orderId = `MN-PRN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  let razorpayOrder = null;

  if (paymentMethod === 'ONLINE') {
    // Create Razorpay Order
    razorpayOrder = await razorpayService.createOrder(pricing.totalAmount, 'INR', {
      orderId,
      type: 'PRINT_ORDER',
      customerPhone: customer.phone,
      docTitle: document.title.substring(0, 40),
    });
  }

  // Save order to database
  const order = await PrintOrder.create({
    orderId,
    user: userId,
    customer: {
      name: customer.name.trim(),
      phone: customer.phone.trim(),
      email: customer.email ? customer.email.trim().toLowerCase() : '',
      address: {
        street: customer.address.street.trim(),
        city: customer.address.city.trim(),
        state: customer.address.state ? customer.address.state.trim() : 'Uttar Pradesh',
        pincode: customer.address.pincode.trim(),
      },
    },
    document: {
      title: document.title.trim(),
      resourceId: document.resourceId || null,
      fileUrl: document.fileUrl || '',
      classLevel: document.classLevel || '',
      subject: document.subject || '',
    },
    provider: {
      code: provider.code || 'LOCAL_PARTNER',
      name: provider.name || 'Nearby Print Store',
    },
    specifications: {
      copies: pricing.copies,
      pageRange: specifications.pageRange || 'All',
      pageCount: pricing.pageCount,
      colorMode: specifications.colorMode || 'BW',
      printSides: specifications.printSides || 'DOUBLE',
      binding: specifications.binding || 'SPIRAL',
    },
    pricing: {
      printCost: pricing.printCost,
      bindingCost: pricing.bindingCost,
      deliveryCost: pricing.deliveryCost,
      totalAmount: pricing.totalAmount,
      currency: 'INR',
    },
    payment: {
      method: paymentMethod === 'COD' ? 'COD' : 'ONLINE',
      status: paymentMethod === 'COD' ? 'COD_VERIFIED' : 'PENDING',
      razorpayOrderId: razorpayOrder ? razorpayOrder.id : null,
    },
    status: paymentMethod === 'COD' ? 'CONFIRMED' : 'PLACED',
    tracking: {
      courierPartner: provider.code === 'BLINKIT' ? 'Blinkit Instant Courier' : provider.code === 'ZEPTO' ? 'Zepto Fast Delivery' : 'Local Fast Courier',
      estimatedDelivery: new Date(Date.now() + (provider.code === 'BLINKIT' || provider.code === 'ZEPTO' ? 2 : 36) * 60 * 60 * 1000),
    },
  });

  return success(res, 'Print order created successfully', {
    order: {
      _id: order._id,
      orderId: order.orderId,
      status: order.status,
      totalAmount: order.pricing.totalAmount,
      pricing: order.pricing,
      paymentMethod: order.payment.method,
      paymentStatus: order.payment.status,
      estimatedDelivery: order.tracking.estimatedDelivery,
    },
    razorpay: razorpayOrder
      ? {
          orderId: razorpayOrder.id,
          amount: pricing.totalAmount,
          currency: 'INR',
          keyId: process.env.RAZORPAY_KEY_ID,
        }
      : null,
  });
});

// ============================================================
// 2. VERIFY RAZORPAY PAYMENT FOR PRINT ORDER
// ============================================================
exports.verifyPrintPayment = asyncHandler(async (req, res, next) => {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return error(res, 'All payment verification parameters are required', 400);
  }

  const order = await PrintOrder.findOne({ orderId });
  if (!order) {
    return error(res, 'Print order not found', 404);
  }

  // Verify Razorpay signature server-side
  const isValid = razorpayService.verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!isValid) {
    order.payment.status = 'FAILED';
    await order.save();
    return error(res, 'Payment signature verification failed', 400, 'PAYMENT_VERIFICATION_FAILED');
  }

  order.payment.status = 'PAID';
  order.payment.razorpayPaymentId = razorpayPaymentId;
  order.payment.razorpaySignature = razorpaySignature;
  order.status = 'CONFIRMED';
  await order.save();

  return success(res, 'Print order confirmed and payment verified successfully', {
    order: {
      orderId: order.orderId,
      status: order.status,
      paymentStatus: order.payment.status,
      totalAmount: order.pricing.totalAmount,
      estimatedDelivery: order.tracking.estimatedDelivery,
      document: order.document,
    },
  });
});

// ============================================================
// 3. GET USER'S PRINT ORDERS (For Student Dashboard)
// ============================================================
exports.getMyPrintOrders = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const orders = await PrintOrder.find({ user: userId })
    .sort({ createdAt: -1 })
    .lean();

  return success(res, 'User print orders retrieved', { orders });
});

// ============================================================
// 4. GET SINGLE ORDER TRACKING DETAILS (Public / Order ID lookup)
// ============================================================
exports.getPrintOrderById = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const order = await PrintOrder.findOne({ orderId }).lean();

  if (!order) {
    return error(res, 'Print order not found', 404);
  }

  return success(res, 'Order details retrieved', {
    order: {
      orderId: order.orderId,
      status: order.status,
      customerName: order.customer.name,
      address: {
        city: order.customer.address.city,
        pincode: order.customer.address.pincode,
      },
      document: order.document,
      specifications: order.specifications,
      pricing: order.pricing,
      paymentStatus: order.payment.status,
      paymentMethod: order.payment.method,
      tracking: order.tracking,
      createdAt: order.createdAt,
    },
  });
});

// ============================================================
// 5. ADMIN: GET ALL PRINT ORDERS
// ============================================================
exports.adminGetPrintOrders = asyncHandler(async (req, res, next) => {
  const { status, provider, page = 1, limit = 20, search } = req.query;

  const query = {};
  if (status && status !== 'ALL') query.status = status;
  if (provider && provider !== 'ALL') query['provider.code'] = provider;
  if (search && search.trim()) {
    const s = search.trim();
    query.$or = [
      { orderId: new RegExp(s, 'i') },
      { 'customer.name': new RegExp(s, 'i') },
      { 'customer.phone': new RegExp(s, 'i') },
      { 'document.title': new RegExp(s, 'i') },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [orders, total] = await Promise.all([
    PrintOrder.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    PrintOrder.countDocuments(query),
  ]);

  // Aggregate metrics
  const stats = await PrintOrder.aggregate([
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.totalAmount' },
        pendingOrders: {
          $sum: { $cond: [{ $in: ['$status', ['PLACED', 'CONFIRMED', 'PRINTING']] }, 1, 0] },
        },
        deliveredOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] },
        },
      },
    },
  ]);

  return success(res, 'Print orders retrieved', {
    orders,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)) || 1,
    },
    metrics: stats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      deliveredOrders: 0,
    },
  });
});

// ============================================================
// 6. ADMIN: UPDATE PRINT ORDER STATUS
// ============================================================
exports.adminUpdatePrintOrderStatus = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const { status, trackingNumber, courierPartner, notes, estimatedDelivery } = req.body;

  const order = await PrintOrder.findOne({ orderId });
  if (!order) {
    return error(res, 'Print order not found', 404);
  }

  if (status) order.status = status;
  if (trackingNumber !== undefined) order.tracking.trackingNumber = trackingNumber;
  if (courierPartner !== undefined) order.tracking.courierPartner = courierPartner;
  if (notes !== undefined) order.tracking.notes = notes;
  if (estimatedDelivery) order.tracking.estimatedDelivery = new Date(estimatedDelivery);

  await order.save();

  return success(res, `Print order ${order.orderId} updated to ${order.status}`, { order });
});

