const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const axios = require('axios');
require('dotenv').config();

// **********************************
// AI IMPORTS (REQUIRED FOR CHATBOT)
// **********************************
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize the AI client
if (!process.env.GEMINI_API_KEY) {
  console.error("ERROR: GEMINI_API_KEY not found in .env. AI Chatbot will be disabled.");
}
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const AI_MODEL = "gemini-2.5-flash";

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded images statically
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carrental', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schemas
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  isAdmin: { type: Boolean, default: false }
}, { timestamps: true });
userSchema.add({
  isPartner: { type: Boolean, default: false },
  partnerSince: { type: Date }
});


// Partner Schema
const partnerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  zipCode: { type: String, required: true },
  nationalId: { type: String, required: true },
  idProof: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  registrationFee: { type: Number, default: 10.00 },
  commissionRate: { type: Number, default: 10 }, // 10% commission
  totalEarnings: { type: Number, default: 0 },
  approvedAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });



const carSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  available: { type: Boolean, default: true },
  description: { type: String, required: true },
  seats: { type: Number, required: true, min: 1, max: 20 },
  transmission: {
    type: String,
    required: true,
    enum: ['manual', 'automatic', 'semi-automatic']
  },
  fuelType: {
    type: String,
    required: true,
    enum: ['petrol', 'diesel', 'electric', 'hybrid', 'cng']
  },
  carType: {
    type: String,
    required: true,
    enum: ['economy', 'sedan', 'suv', 'luxury', 'sports', 'van', 'convertible'],
    default: 'sedan'
  },
  features: { type: [String], default: [] },
  mileage: { type: String },
  color: { type: String }
}, { timestamps: true });
carSchema.add({
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPartnerCar: { type: Boolean, default: false },
    adminDeactivated: { type: Boolean, default: false } 
});

// Payment Schema
const paymentSchema = new mongoose.Schema({
  partner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true,
    min: 1
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['bank_transfer', 'upi'] // Only two options now
  },
  bankDetails: {
    // For bank transfer
    accountName: String,
    accountNumber: String,
    bankName: String,
    ifscCode: String,
    // For UPI
    upiId: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed', 'cancelled'],
    default: 'pending'
  },
  transactionId: {
    type: String
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  },
  notes: {
    type: String
  }
}, { timestamps: true });




const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalDays: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  pickupLocation: { type: String, required: true },
  dropoffLocation: { type: String, required: true },
  contactNumber: { type: String, required: true },
  specialRequests: { type: String },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  paymentIntentId: { type: String },
  paidAt: { type: Date },
  refundedAt: { type: Date }
}, { timestamps: true });

// TICKET SCHEMA (REQUIRED for raise_ticket tool)
const ticketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  issue: { type: String, required: true },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'closed'],
    default: 'open'
  },
  conversation: [{
    sender: { type: String, enum: ['user', 'admin'], required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Models
const User = mongoose.model('User', userSchema);
const Car = mongoose.model('Car', carSchema);
const Booking = mongoose.model('Booking', bookingSchema);
const Ticket = mongoose.model('Ticket', ticketSchema);
const Partner = mongoose.model('Partner', partnerSchema);
const Payment = mongoose.model('Payment', paymentSchema);
const partnerOtpStore = new Map();
// Middlewares
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'driveeasy_jwt_secret_2024', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      message: 'Admin access required',
      user: req.user
    });
  }
  next();
};

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${timestamp}_${safeOriginal}`);
  }
});


const createPartnerDirectories = (userId) => {
  const userDir = path.join(__dirname, 'user', userId.toString());
  const uploadsDir = path.join(userDir, 'uploads');
  
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
};

// Partner file upload configuration
const partnerDocStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userId = req.user.userId;
    const userDir = path.join(__dirname, 'user', userId.toString());
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `id_proof_${timestamp}_${safeOriginal}`);
  }
});

const partnerCarImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userId = req.user.userId;
    const uploadsDir = path.join(__dirname, 'user', userId.toString(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `car_${timestamp}_${safeOriginal}`);
  }
});

const uploadPartnerDoc = multer({
  storage: partnerDocStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, JPG, and PDF files are allowed'));
    }
    cb(null, true);
  }
});

const uploadPartnerCarImage = multer({
  storage: partnerCarImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, and JPG images are allowed'));
    }
    cb(null, true);
  }
});




const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, and WEBP images are allowed'));
    }
    cb(null, true);
  }
});

// Auth Routes
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone
    });

    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || 'driveeasy_jwt_secret_2024',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/refresh-token', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newToken = jwt.sign(
      {
        userId: user._id,
        isAdmin: user.isAdmin
      },
      process.env.JWT_SECRET || 'driveeasy_jwt_secret_2024',
      { expiresIn: '24h' }
    );

    res.json({
      token: newToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Partner Payment Routes

// Partner balance
// ===================================
// PARTNER PAYMENT ROUTES
// ===================================

// Partner balance - FIXED VERSION
app.get('/api/partner/balance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log('🔍 Calculating balance for user:', userId);

    // METHOD 1: Direct database queries (more reliable)
    const partnerCars = await Car.find({ 
      partner: userId,
      isPartnerCar: true 
    }).select('_id');

    const carIds = partnerCars.map(car => car._id);
    console.log('Found cars:', carIds.length);

    // Get all completed bookings for partner's cars
    const completedBookings = await Booking.find({
      car: { $in: carIds },
      status: 'completed',
      paymentStatus: 'paid'
    }).select('totalAmount');

    const totalEarnings = completedBookings.reduce((sum, booking) => {
      return sum + (booking.totalAmount * 0.9); // 90% after commission
    }, 0);

    console.log('Total earnings from bookings:', totalEarnings);

    // Get all payments
    const allPayments = await Payment.find({ partner: userId }).select('amount status');

    const paidPayments = allPayments.filter(p => p.status === 'paid');
    const blockedPayments = allPayments.filter(p => ['pending', 'processing'].includes(p.status));

    const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalBlocked = blockedPayments.reduce((sum, p) => sum + p.amount, 0);

    console.log('Paid payments:', paidPayments.length, 'Total:', totalPaid);
    console.log('Blocked payments:', blockedPayments.length, 'Total:', totalBlocked);

    const availableBalance = Math.max(0, totalEarnings - totalPaid - totalBlocked);

    console.log('💰 Final balance:', availableBalance);
    console.log('Calculation:', `${totalEarnings} - ${totalPaid} - ${totalBlocked} = ${availableBalance}`);

    res.json({
      availableBalance: parseFloat(availableBalance.toFixed(2)),
      pendingBalance: parseFloat(totalBlocked.toFixed(2)),
      totalEarnings: parseFloat(totalEarnings.toFixed(2)),
      totalRedeemed: parseFloat(totalPaid.toFixed(2)),
      blockedAmount: parseFloat(totalBlocked.toFixed(2)),
      debug: {
        earnings: totalEarnings,
        paid: totalPaid,
        blocked: totalBlocked,
        calculation: `${totalEarnings} - ${totalPaid} - ${totalBlocked} = ${availableBalance}`
      }
    });

  } catch (error) {
    console.error('❌ Balance calculation error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Partner payment history
app.get('/api/partner/payment-history', authenticateToken, async (req, res) => {
  try {
    const payments = await Payment.find({ partner: req.user.userId })
      .sort({ requestedAt: -1 })
      .limit(50);

    res.json({ payments });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Debug endpoint for payments
app.get('/api/partner/debug-payments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log('🔧 Debug request for user:', userId);

    const allPayments = await Payment.find({ partner: userId })
      .sort({ requestedAt: -1 })
      .select('amount status paymentMethod requestedAt processedAt');

    const paidPayments = allPayments.filter(p => p.status === 'paid');
    const pendingPayments = allPayments.filter(p => p.status === 'pending');
    const processingPayments = allPayments.filter(p => p.status === 'processing');

    const paidTotal = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const pendingTotal = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
    const processingTotal = processingPayments.reduce((sum, p) => sum + p.amount, 0);

    console.log('📊 Payment summary:');
    console.log('Total payments:', allPayments.length);
    console.log('Paid:', paidPayments.length, 'Total:', paidTotal);
    console.log('Pending:', pendingPayments.length, 'Total:', pendingTotal);
    console.log('Processing:', processingPayments.length, 'Total:', processingTotal);

    res.json({
      allPayments: allPayments,
      summary: {
        totalPayments: allPayments.length,
        paid: {
          count: paidPayments.length,
          total: paidTotal
        },
        pending: {
          count: pendingPayments.length,
          total: pendingTotal
        },
        processing: {
          count: processingPayments.length,
          total: processingTotal
        }
      }
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
    res.status(500).json({ 
      message: 'Debug error', 
      error: error.message 
    });
  }
});

// Redeem payment - FIXED VERSION
app.post('/api/partner/redeem', authenticateToken, async (req, res) => {
  try {
    const { amount, paymentMethod, bankDetails } = req.body;
    const userId = req.user.userId;

    console.log('=== REDEEM REQUEST START ===');
    console.log('User ID:', userId, 'Amount:', amount);

    // Validate amount
    const redeemAmount = parseFloat(amount);
    if (!redeemAmount || redeemAmount < 1) {
      return res.status(400).json({ message: 'Minimum redemption amount is $1.00' });
    }

    if (redeemAmount > 100000) {
      return res.status(400).json({ message: 'Maximum redemption amount is $100,000' });
    }

    // Calculate available balance directly
    const partnerCars = await Car.find({ 
      partner: userId,
      isPartnerCar: true 
    }).select('_id');
    
    const carIds = partnerCars.map(car => car._id);

    // Get all completed bookings for partner's cars
    const completedBookings = await Booking.find({
      car: { $in: carIds },
      status: 'completed',
      paymentStatus: 'paid'
    }).select('totalAmount');

    const totalEarnings = completedBookings.reduce((sum, booking) => {
      return sum + (booking.totalAmount * 0.9);
    }, 0);

    // Get all payments
    const allPayments = await Payment.find({ partner: userId }).select('amount status');

    const paidPayments = allPayments.filter(p => p.status === 'paid');
    const blockedPayments = allPayments.filter(p => ['pending', 'processing'].includes(p.status));

    const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalBlocked = blockedPayments.reduce((sum, p) => sum + p.amount, 0);

    const availableBalance = Math.max(0, totalEarnings - totalPaid - totalBlocked);

    console.log('Balance Check:');
    console.log('Total Earnings:', totalEarnings);
    console.log('Total Paid:', totalPaid);
    console.log('Total Blocked:', totalBlocked);
    console.log('Available Balance:', availableBalance);
    console.log('Requested Amount:', redeemAmount);

    if (redeemAmount > availableBalance) {
      return res.status(400).json({ 
        message: `Insufficient balance. Available: $${availableBalance.toFixed(2)}, Requested: $${redeemAmount.toFixed(2)}` 
      });
    }

    // Validate payment method
    const validPaymentMethods = ['bank_transfer', 'upi'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    // Validate payment details based on method
    if (paymentMethod === 'bank_transfer') {
      if (!bankDetails || !bankDetails.accountName || !bankDetails.accountNumber || 
          !bankDetails.bankName || !bankDetails.ifscCode) {
        return res.status(400).json({ message: 'All bank details are required for bank transfer' });
      }
      
      // Basic validation
      if (bankDetails.accountName.trim().length < 2) {
        return res.status(400).json({ message: 'Account holder name must be at least 2 characters' });
      }
      
      if (bankDetails.accountNumber.length < 5) {
        return res.status(400).json({ message: 'Invalid account number' });
      }
      
      if (bankDetails.bankName.trim().length < 2) {
        return res.status(400).json({ message: 'Bank name must be at least 2 characters' });
      }
      
      if (bankDetails.ifscCode.length < 8) {
        return res.status(400).json({ message: 'Invalid IFSC code' });
      }
    }

    if (paymentMethod === 'upi') {
      if (!bankDetails || !bankDetails.upiId) {
        return res.status(400).json({ message: 'UPI ID is required for UPI payments' });
      }

      // Basic UPI validation
      if (!bankDetails.upiId.includes('@')) {
        return res.status(400).json({ message: 'Invalid UPI ID format. Should be like: yourname@upi' });
      }
      
      if (bankDetails.upiId.length < 5) {
        return res.status(400).json({ message: 'UPI ID must be at least 5 characters' });
      }
    }

    // Check if user has a pending/processing payment request
    const existingPayment = await Payment.findOne({
      partner: userId,
      status: { $in: ['pending', 'processing'] }
    });

    if (existingPayment) {
      return res.status(400).json({ 
        message: `You already have a ${existingPayment.status} payment request for $${existingPayment.amount}. Please wait for it to be processed.` 
      });
    }

    // Create payment record with pending status (this will block the amount)
    const paymentData = {
      partner: userId,
      amount: redeemAmount,
      paymentMethod: paymentMethod,
      bankDetails: bankDetails,
      status: 'pending', // This status blocks the amount until admin approval
      requestedAt: new Date()
    };

    const payment = new Payment(paymentData);
    await payment.save();

    console.log('✅ Payment record created with pending status, amount blocked:', payment._id);
    console.log('=== REDEEM REQUEST END ===');

    res.json({
      success: true,
      message: 'Payment redemption request submitted successfully! Waiting for admin approval. The amount has been temporarily blocked.',
      paymentId: payment._id,
      amount: redeemAmount,
      status: 'pending'
    });

  } catch (error) {
    console.error('❌ Payment redemption error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during payment processing', 
      error: error.message 
    });
  }
});

// ===================================
// ADMIN PAYMENT MANAGEMENT ROUTES
// ===================================

// Get all payments for admin
app.get('/api/admin/payments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    const payments = await Payment.find(query)
      .populate('partner', 'name email')
      .sort({ requestedAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin payment approval route
app.put('/api/admin/payments/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('partner', 'name email');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status === 'paid') {
      return res.status(400).json({ message: 'Payment is already paid' });
    }

    // Update payment status to paid
    const updatedPayment = await Payment.findByIdAndUpdate(
      req.params.id,
      {
        status: 'paid',
        processedAt: new Date(),
        transactionId: req.body.transactionId || `ADMIN${Date.now()}${Math.random().toString(36).substr(2, 5)}`.toUpperCase()
      },
      { new: true }
    ).populate('partner', 'name email');

    console.log(`✅ Payment ${payment._id} approved. Amount: $${payment.amount}`);

    res.json({
      success: true,
      message: `Payment approved successfully! $${updatedPayment.amount} has been paid to partner.`,
      payment: updatedPayment
    });

  } catch (error) {
    console.error('❌ Payment approval error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Admin payment processing route
app.put('/api/admin/payments/:id/processing', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('partner', 'name email');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status === 'paid') {
      return res.status(400).json({ message: 'Payment is already paid' });
    }

    // Update payment status to processing
    const updatedPayment = await Payment.findByIdAndUpdate(
      req.params.id,
      {
        status: 'processing',
        processedAt: new Date()
      },
      { new: true }
    ).populate('partner', 'name email');

    console.log(`🔄 Payment ${payment._id} marked as processing. Amount: $${payment.amount}`);

    res.json({
      success: true,
      message: `Payment marked as processing. $${updatedPayment.amount} will be paid shortly.`,
      payment: updatedPayment
    });

  } catch (error) {
    console.error('❌ Payment processing error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Admin payment rejection route
app.put('/api/admin/payments/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('partner', 'name email');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status === 'paid') {
      return res.status(400).json({ message: 'Cannot reject a paid payment' });
    }

    // Update payment status to failed (this will unblock the amount)
    const updatedPayment = await Payment.findByIdAndUpdate(
      req.params.id,
      {
        status: 'failed',
        processedAt: new Date(),
        notes: req.body.reason || 'Payment rejected by admin'
      },
      { new: true }
    ).populate('partner', 'name email');

    console.log(`❌ Payment ${payment._id} rejected. Amount: $${payment.amount} returned to balance.`);

    res.json({
      success: true,
      message: `Payment rejected. $${updatedPayment.amount} has been returned to partner's available balance.`,
      payment: updatedPayment
    });

  } catch (error) {
    console.error('❌ Payment rejection error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Admin route to fix payment calculations
app.put('/api/admin/fix-payments/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Get all payments for user
    const payments = await Payment.find({ partner: userId });
    
    let updatedCount = 0;
    for (const payment of payments) {
      if (payment.status === 'paid' && !payment.processedAt) {
        await Payment.findByIdAndUpdate(payment._id, {
          processedAt: payment.requestedAt || new Date()
        });
        updatedCount++;
      }
    }
    
    res.json({
      success: true,
      message: `Fixed ${updatedCount} payments for user ${userId}`,
      totalPayments: payments.length
    });
    
  } catch (error) {
    console.error('❌ Fix payments error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Fix error', 
      error: error.message 
    });
  }
});

// Reset partner payments (admin only)
app.post('/api/admin/reset-partner-payments/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Delete all payments for this user
    const result = await Payment.deleteMany({ partner: userId });
    
    console.log(`🔄 Reset all payments for user ${userId}. Deleted: ${result.deletedCount}`);
    
    res.json({
      success: true,
      message: `All payments reset for user ${userId}. ${result.deletedCount} payments deleted. Partner can now create new redemption requests.`,
      deletedCount: result.deletedCount
    });
    
  } catch (error) {
    console.error('❌ Reset error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Reset error', 
      error: error.message 
    });
  }
});

// Get payment statistics for admin dashboard
app.get('/api/admin/payment-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalPayments = await Payment.countDocuments();
    const pendingPayments = await Payment.countDocuments({ status: 'pending' });
    const processingPayments = await Payment.countDocuments({ status: 'processing' });
    const paidPayments = await Payment.countDocuments({ status: 'paid' });
    
    const totalAmountResult = await Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const totalAmountPaid = totalAmountResult.length > 0 ? totalAmountResult[0].total : 0;

    res.json({
      totalPayments,
      pendingPayments,
      processingPayments,
      paidPayments,
      totalAmountPaid,
      stats: {
        pendingAmount: await getTotalAmountByStatus('pending'),
        processingAmount: await getTotalAmountByStatus('processing'),
        paidAmount: totalAmountPaid
      }
    });

  } catch (error) {
    console.error('❌ Payment stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to get total amount by status
async function getTotalAmountByStatus(status) {
  const result = await Payment.aggregate([
    { $match: { status: status } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  return result.length > 0 ? result[0].total : 0;
}

//Payment END



app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Car Routes
app.get('/api/cars', async (req, res) => {
  try {
    const cars = await Car.find().sort({ createdAt: -1 });
    res.json(cars);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/cars/:id', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    res.json(car);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/cars', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const car = new Car(req.body);
    await car.save();
    res.status(201).json(car);
  } catch (error) {
    res.status(500).json({
      message: 'Server error: Check if all required fields are correctly provided.',
      error: error.message
    });
  }
});

app.put('/api/cars/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const car = await Car.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    res.json(car);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/cars/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const car = await Car.findByIdAndDelete(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    res.json({ message: 'Car deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload endpoint (admin only)
app.post('/api/upload', authenticateToken, requireAdmin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const relativePath = `/uploads/${req.file.filename}`;
    res.status(201).json({
      message: 'Image uploaded successfully',
      url: `http://localhost:${PORT}${relativePath}`,
      path: relativePath
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// Booking Routes
app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const { carId, startDate, endDate, pickupLocation, dropoffLocation, contactNumber, specialRequests } = req.body;

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    if (!car.available) {
      return res.status(400).json({ message: 'Car is not available' });
    }

    // Check if car is already booked for these dates
    const existingBooking = await Booking.findOne({
      car: carId,
      status: { $in: ['confirmed', 'active'] },
      $or: [
        { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } }
      ]
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'Car is already booked for these dates' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalAmount = totalDays * car.price;

    const booking = new Booking({
      user: req.user.userId,
      car: carId,
      startDate: start,
      endDate: end,
      totalDays,
      totalAmount,
      pickupLocation,
      dropoffLocation,
      contactNumber,
      specialRequests
    });

    await booking.save();
    // Update car availability
    await Car.findByIdAndUpdate(carId, { available: false });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('car', 'name brand model image')
      .populate('user', 'name email');

    res.status(201).json(populatedBooking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/bookings', authenticateToken, async (req, res) => {
  try {
    let query = {};

    // If not admin, only show user's own bookings
    if (!req.user.isAdmin) {
      query.user = req.user.userId;
    }

    const bookings = await Booking.find(query)
      .populate('car', 'name brand model image price')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/bookings/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('car').populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // If booking is cancelled or completed, make car available again
    if (status === 'cancelled' || status === 'completed') {
      await Car.findByIdAndUpdate(booking.car._id, { available: true });
    } else if (status === 'confirmed' || status === 'active') {
      await Car.findByIdAndUpdate(booking.car._id, { available: false });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Users can only cancel their own bookings, admins can cancel any
    if (!req.user.isAdmin && booking.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Allow cancellation for pending, confirmed, and active bookings
    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({
        message: `Cannot cancel a booking that is already ${booking.status}`
      });
    }

    // Update booking status to cancelled
    await Booking.findByIdAndUpdate(req.params.id, { status: 'cancelled' });

    // Make the car available again
    await Car.findByIdAndUpdate(booking.car, { available: true });

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Ticket Management Routes
app.get('/api/tickets', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    const tickets = await Ticket.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/tickets/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('user', 'name email phone');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/tickets/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'name email phone');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/tickets/:id/reply', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { message } = req.body;
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          conversation: {
            sender: 'admin',
            message: message,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    ).populate('user', 'name email phone');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/tickets/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Customer Ticket Routes
app.get('/api/my-tickets', authenticateToken, async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user.userId })
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/my-tickets/:id', authenticateToken, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/my-tickets', authenticateToken, async (req, res) => {
  try {
    const { issue } = req.body;

    if (!issue || issue.trim() === '') {
      return res.status(400).json({ message: 'Issue description is required' });
    }

    const ticket = new Ticket({
      user: req.user.userId,
      issue: issue.trim(),
      conversation: [{
        sender: 'user',
        message: issue.trim(),
        timestamp: new Date()
      }]
    });

    await ticket.save();

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('user', 'name email phone');

    res.status(201).json(populatedTicket);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/my-tickets/:id/reply', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Message is required' });
    }

    const ticket = await Ticket.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.userId
      },
      {
        $push: {
          conversation: {
            sender: 'user',
            message: message.trim(),
            timestamp: new Date()
          }
        },
        // Re-open ticket if it was closed
        $set: {
          status: 'open'
        }
      },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// INVOICE ROUTE
app.get('/api/bookings/:id/invoice', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('car', 'name brand model year price image')
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Users can only access their own invoices, admins can access all
    if (!req.user.isAdmin && booking.user._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Generate invoice data - FIXED: Use booking creation date with proper formatting
    const invoiceData = {
      invoiceNumber: `INV-${booking._id.toString().slice(-8).toUpperCase()}`,
      invoiceDate: booking.createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }), // CHANGED: Use booking creation date with proper format
      bookingId: booking._id,
      customer: {
        name: booking.user.name,
        email: booking.user.email,
        phone: booking.user.phone
      },
      car: {
        brand: booking.car.brand,
        model: booking.car.model,
        name: booking.car.name,
        year: booking.car.year,
        image: booking.car.image
      },
      rentalDetails: {
        startDate: booking.startDate.toLocaleDateString(),
        endDate: booking.endDate.toLocaleDateString(),
        totalDays: booking.totalDays,
        pricePerDay: booking.car.price,
        totalAmount: booking.totalAmount
      },
      company: {
        name: "CarRental",
        address: "Surat, Gujarat",
        phone: "+91 98751 96322",
        email: "info@carrental.com"
      }
    };

    res.json(invoiceData);
  } catch (error) {
    console.error('Invoice generation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// User Management Routes (Admin only)
app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { isAdmin } = req.body;

    // Prevent admin from removing their own admin privileges
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { isAdmin },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: `User role updated to ${isAdmin ? 'Admin' : 'User'} successfully`,
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if email already exists for other users
    if (email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: req.params.id }
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    const updateData = { name, email, phone };

    // If password is provided, hash it and add to update data
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/bookings/:id/payment-status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    
    // Validate payment status
    const validStatuses = ['pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled'];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Update payment status
    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      { 
        paymentStatus,
        ...(paymentStatus === 'paid' && !booking.paidAt && { paidAt: new Date() }),
        ...(paymentStatus === 'refunded' && !booking.refundedAt && { refundedAt: new Date() })
      },
      { new: true }
    ).populate('car').populate('user', 'name email');

    // Handle side effects based on payment status changes
    if (paymentStatus === 'paid' && booking.status === 'pending') {
      await Booking.findByIdAndUpdate(req.params.id, { status: 'confirmed' });
      await Car.findByIdAndUpdate(booking.car._id, { available: false });
    } else if ((paymentStatus === 'failed' || paymentStatus === 'cancelled') && 
               ['confirmed', 'active'].includes(booking.status)) {
      await Car.findByIdAndUpdate(booking.car._id, { available: true });
    }

    res.json({
      message: `Payment status updated to ${paymentStatus} successfully`,
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Payment status update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ===================================
// ===================================
// AI CHATBOT NLU SECTION (FULL IMPLEMENTATION)
// ===================================
// ===================================

const chatSessions = {};

/**
 * @FIX: Utility to reset the AI session state.
 */
function resetSession(session) {
  session.flow = 'none';
  session.step = 'start';
  session.data = {};
}

function parseDate(dateString) {
  if (!dateString) return null;

  const lower = dateString.toLowerCase().trim();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (lower === 'today') {
    return today;
  }
  if (lower === 'tomorrow') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  // Handle YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(lower)) {
    const date = new Date(lower + 'T00:00:00');
    if (!isNaN(date.getTime()) && date >= today) {
      return date;
    }
  }

  return null;
}


function isConfirmation(text) {
  if (!text) return false;

  const lower = text.trim().toLowerCase();

  // Only check for actual confirmation words, not locations
  const confirmationWords = ['yes', 'no', 'yep', 'nope', 'sure', 'of course', 'nvm', 'cancel', 'confirm', 'ok', 'okay'];

  return confirmationWords.includes(lower) ||
    lower === 'y' ||
    lower === 'n' ||
    lower === 'i do' ||
    lower === 'ofcourse';
}

// Database Access Functions for AI
async function getDatabaseInfo(userId) {
  try {
    // Get user's bookings
    const userBookings = await Booking.find({ user: userId })
      .populate('car', 'name brand model image price')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get available cars
    const availableCars = await Car.find({ available: true })
      .select('name brand model price year seats transmission fuelType features mileage color')
      .limit(20);

    // Get user's tickets
    const userTickets = await Ticket.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    return {
      userBookings: userBookings.map(booking => ({
        id: booking._id.toString().slice(-8),
        car: `${booking.car.brand} ${booking.car.model}`,
        dates: `${booking.startDate.toLocaleDateString()} to ${booking.endDate.toLocaleDateString()}`,
        status: booking.status,
        amount: booking.totalAmount
      })),
      availableCars: availableCars.map(car => ({
        name: `${car.brand} ${car.model}`,
        brand: car.brand,
        model: car.model,
        price: car.price,
        year: car.year,
        seats: car.seats,
        transmission: car.transmission,
        fuelType: car.fuelType,
        features: car.features,
        mileage: car.mileage,
        color: car.color
      })),
      userTickets: userTickets.map(ticket => ({
        id: ticket._id.toString().slice(-6),
        issue: ticket.issue,
        status: ticket.status,
        createdAt: ticket.createdAt.toLocaleDateString()
      }))
    };
  } catch (error) {
    console.error('Error getting database info:', error);
    return { userBookings: [], availableCars: [], userTickets: [] };
  }
}

// Enhanced available tools with database access
const availableTools = [
  {
    name: "search_car",
    description: "Searches for an available car based on name, brand, model, type, features, or specifications. Can filter by price range, fuel type, transmission, seats, etc.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "The brand, model, type, features, or specifications of the car (e.g., Mustang, Toyota, electric car, SUV, 7 seats, automatic, under $100)" },
        filters: {
          type: "object",
          description: "Optional filters: minPrice, maxPrice, fuelType, transmission, minSeats, maxSeats, features"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "get_car_details",
    description: "Get detailed information about a specific car including all specifications, features, and availability status.",
    parameters: {
      type: "object",
      properties: {
        carName: { type: "string", description: "The specific car name, brand, or model to get details for" }
      },
      required: ["carName"]
    }
  },
  {
    name: "get_my_bookings",
    description: "Get the user's current and past bookings with detailed status, dates, and car information.",
    parameters: {
      type: "object",
      properties: {
        status: { type: "string", description: "Optional filter by status: active, upcoming, past, cancelled" }
      }
    }
  },
  {
    name: "check_availability",
    description: "Check if a specific car is available for given dates.",
    parameters: {
      type: "object",
      properties: {
        carName: { type: "string", description: "The car to check availability for" },
        startDate: { type: "string", description: "Start date in YYYY-MM-DD format" },
        endDate: { type: "string", description: "End date in YYYY-MM-DD format" }
      },
      required: ["carName", "startDate", "endDate"]
    }
  },
  {
    name: "start_booking",
    description: "The user is expressing interest in booking or renting a car. Use this to initiate the booking flow, even if details are missing.",
    parameters: {
      type: "object",
      properties: {
        carName: { type: "string", description: "The preferred car name or brand, if provided (e.g., 'mustang', 'honda civic')." },
        startDate: { type: "string", description: "The start date for the rental, if provided, in YYYY-MM-DD format (must be a future date). Use the parseDate helper to format." },
        endDate: { type: "string", description: "The end date for the rental, if provided, in YYYY-MM-DD format (must be after start date). Use the parseDate helper to format." }
      }
    }
  },
  {
    name: "manage_booking",
    description: "The user wants to cancel or modify an existing booking. Use when they mention 'cancel', 'change dates', 'modify booking', or provide a booking ID.",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["cancel", "edit_dates"], description: "The action to perform: 'cancel' or 'edit_dates'." },
        bookingIdOrCarName: { type: "string", description: "The booking ID (last 8 digits) or the car name in the booking to manage." }
      },
      required: ["action"]
    }
  },
  {
    name: "raise_ticket",
    description: "The user wants to register a new support or customer service ticket for an issue/problem.",
    parameters: {
      type: "object",
      properties: {
        issueDescription: { type: "string", description: "The full detailed description of the problem the user is experiencing. Only use this if the description is provided in the message." }
      }
    }
  },
  {
    name: "get_bookings",
    description: "The user wants to see their past, current, or upcoming bookings, or get the status of a specific booking.",
    parameters: {
      type: "object",
      properties: {
        bookingId: { type: "string", description: "The specific booking ID (last 8 digits) the user is asking about, if provided." } // FIXED: 6 → 8
      }
    }
  },
  {
    name: "get_quote",
    description: "The user is asking for a price or quote for a car rental, but is NOT ready to book yet.",
    parameters: {
      type: "object",
      properties: {
        carName: { type: "string", description: "The specific car name, brand, or model the user is asking about (e.g., Mustang, Tesla)." },
        startDate: { type: "string", description: "The start date for the quote, in YYYY-MM-DD format. Only include if explicitly provided." },
        endDate: { type: "string", description: "The end date for the quote, in YYYY-MM-DD format. Only include if explicitly provided." }
      },
      required: ["carName"]
    }
  },
{
  name: "initiate_payment",
  description: "Guides user to My Bookings page for payment processing. Use when user wants to make a payment.",
  parameters: {
    type: "object",
    properties: {
      bookingId: { 
        type: "string", 
        description: "The booking ID (last 8 digits) the user wants to pay for" 
      }
    },
    required: ["bookingId"]
  }
},
  {
    name: "get_database_info",
    description: "Get comprehensive information about available cars, user bookings, and support tickets. Use when user asks general questions about what's available or their account status.",
    parameters: {
      type: "object",
      properties: {
        infoType: { type: "string", description: "Type of information needed: cars, bookings, tickets, or all" }
      }
    }
  }
];

// **********************************
// AI TOOL FUNCTIONS (Backend logic)
// **********************************

// Helper for price calculation
function calculatePrice(car, start, end) {
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  // Ensure minimum 1 day booking
  return { days: Math.max(1, diffDays), price: Math.max(1, diffDays) * car.price };
}

async function createBooking(userId, car, startDate, endDate, totalDays, totalAmount, pickupLocation, dropoffLocation) {
  // Final availability check before booking
  const conflict = await Booking.findOne({
    car: car._id,
    status: { $in: ['confirmed', 'active'] },
    $or: [
      { startDate: { $lt: endDate }, endDate: { $gt: startDate } }
    ]
  });

  if (conflict) {
    // This should ideally be caught in the flow handler, but this is a final safeguard
    return { status: 'failure', message: `Booking failed. The ${car.brand} ${car.model} is no longer available for those dates.` };
  }

  const booking = new Booking({
    user: userId,
    car: car._id,
    startDate,
    endDate,
    totalDays,
    totalAmount,
    pickupLocation,
    dropoffLocation,
    contactNumber: 'N/A (AI Booking)', // Placeholder for chatbot bookings
    specialRequests: 'Booked via AI Assistant',
    status: 'confirmed'
  });
  await booking.save();
  await Car.findByIdAndUpdate(car._id, { available: false });

  return {
    status: 'success',
    bookingId: booking._id.toString().slice(-8),
    message: `Booking successful! Your Booking ID is **${booking._id.toString().slice(-8)}**. The total is $${totalAmount} for ${totalDays} days.`,
    booking: booking
  };
}

// Enhanced car search with filters
// In server.js - Update the handleCarSearch function
async function handleCarSearch(query, filters = {}) {
  let searchConditions = {
    $or: [
      { name: new RegExp(query, 'i') },
      { brand: new RegExp(query, 'i') },
      { model: new RegExp(query, 'i') },
      { description: new RegExp(query, 'i') },
      { transmission: new RegExp(query, 'i') },
      { fuelType: new RegExp(query, 'i') },
      { features: new RegExp(query, 'i') },
      { carType: new RegExp(query, 'i') } // ADD THIS LINE
    ],
    available: true
  };

  // Apply filters
  if (filters.minPrice) searchConditions.price = { ...searchConditions.price, $gte: parseInt(filters.minPrice) };
  if (filters.maxPrice) searchConditions.price = { ...searchConditions.price, $lte: parseInt(filters.maxPrice) };
  if (filters.fuelType) searchConditions.fuelType = new RegExp(filters.fuelType, 'i');
  if (filters.transmission) searchConditions.transmission = new RegExp(filters.transmission, 'i');
  if (filters.carType) searchConditions.carType = new RegExp(filters.carType, 'i'); // ADD THIS LINE
  if (filters.minSeats) searchConditions.seats = { ...searchConditions.seats, $gte: parseInt(filters.minSeats) };
  if (filters.maxSeats) searchConditions.seats = { ...searchConditions.seats, $lte: parseInt(filters.maxSeats) };

  const cars = await Car.find(searchConditions)
    .limit(10)
    .select('name brand model year price image seats description transmission fuelType carType features mileage color');

  if (cars.length === 0) {
    return { message: `I couldn't find any available cars matching "${query}".` };
  }

  const carList = cars.slice(0, 8).map(car => ({
    type: 'car',
    car: {
      _id: car._id,
      name: `${car.brand} ${car.model}`,
      year: car.year,
      price: car.price,
      image: car.image,
      seats: car.seats,
      transmission: car.transmission,
      fuelType: car.fuelType,
      carType: car.carType, // ADD THIS
      features: car.features,
      mileage: car.mileage,
      color: car.color,
      description: car.description
    }
  }));

  let message = `I found ${cars.length} matching ${cars.length > 1 ? 'cars' : 'car'}. Here are the top results:`;

  if (filters.minPrice || filters.maxPrice) {
    message += ` (Filtered by price: ${filters.minPrice ? `$${filters.minPrice}+` : ''}${filters.maxPrice ? ` up to $${filters.maxPrice}` : ''})`;
  }

  if (filters.carType) { // ADD THIS
    message += ` (Type: ${filters.carType})`;
  }

  return {
    message: message,
    structuredData: carList
  };
}

// Get detailed car information
async function handleGetCarDetails(carName) {
  const car = await Car.findOne({
    $or: [
      { name: new RegExp(carName, 'i') },
      { brand: new RegExp(carName, 'i') },
      { model: new RegExp(carName, 'i') }
    ]
  }).select('name brand model year price image seats description transmission fuelType features mileage color available');

  if (!car) {
    return { message: `I couldn't find any car matching "${carName}".` };
  }

  const features = car.features && car.features.length > 0 ? car.features.join(', ') : 'Standard features';

  const message = `**${car.brand} ${car.model} (${car.year})**\n\n` +
    `💰 **Price:** $${car.price}/day\n` +
    `👥 **Seats:** ${car.seats}\n` +
    `⚙️ **Transmission:** ${car.transmission}\n` +
    `⛽ **Fuel Type:** ${car.fuelType}\n` +
    `🎨 **Color:** ${car.color || 'Not specified'}\n` +
    `📊 **Mileage:** ${car.mileage || 'Not specified'}\n` +
    `🔧 **Features:** ${features}\n` +
    `📝 **Description:** ${car.description}\n` +
    `✅ **Availability:** ${car.available ? 'Available' : 'Currently Unavailable'}`;

  return {
    message: message,
    structuredData: [{
      type: 'car_details',
      car: {
        _id: car._id,
        name: `${car.brand} ${car.model}`,
        year: car.year,
        price: car.price,
        image: car.image,
        seats: car.seats,
        transmission: car.transmission,
        fuelType: car.fuelType,
        features: car.features,
        mileage: car.mileage,
        color: car.color,
        available: car.available
      }
    }]
  };
}

// Get user's bookings with status filter
async function handleGetMyBookings(user, status = null) {
  let query = { user: user._id };

  if (status) {
    const statusMap = {
      'active': ['confirmed', 'active'],
      'upcoming': ['pending', 'confirmed'],
      'past': ['completed'],
      'cancelled': ['cancelled']
    };

    if (statusMap[status]) {
      query.status = { $in: statusMap[status] };
    }
  }

  const bookings = await Booking.find(query)
    .populate('car', 'name brand model image')
    .sort({ createdAt: -1 })
    .limit(10);

  if (bookings.length === 0) {
    const statusText = status ? ` ${status}` : '';
    return { message: `You have no${statusText} bookings.` };
  }

  const bookingList = bookings.map(booking => ({
    type: 'booking',
    booking: {
      id: booking._id.toString().slice(-8),
      car: `${booking.car.brand} ${booking.car.model}`,
      dates: `${booking.startDate.toLocaleDateString()} to ${booking.endDate.toLocaleDateString()}`,
      status: booking.status,
      amount: booking.totalAmount,
      days: booking.totalDays
    }
  }));

  let message = `Here are your ${status ? status + ' ' : ''}bookings:\n\n`;
  bookings.forEach(booking => {
    message += `• **ID ${booking._id.toString().slice(-8)}**: ${booking.car.brand} ${booking.car.model}\n`;
    message += `  📅 ${booking.startDate.toLocaleDateString()} to ${booking.endDate.toLocaleDateString()}\n`;
    message += `  💰 $${booking.totalAmount} for ${booking.totalDays} days\n`;
    message += `  📊 Status: ${booking.status}\n\n`;
  });

  return {
    message: message,
    structuredData: bookingList
  };
}

// Check car availability for specific dates
async function handleCheckAvailability(carName, startDate, endDate) {
  const car = await Car.findOne({
    $or: [
      { name: new RegExp(carName, 'i') },
      { brand: new RegExp(carName, 'i') },
      { model: new RegExp(carName, 'i') }
    ]
  });

  if (!car) {
    return { message: `I couldn't find any car matching "${carName}".` };
  }

  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (!start || !end || end <= start) {
    return { message: "Please provide valid start and end dates in YYYY-MM-DD format." };
  }

  // Check for conflicting bookings
  const conflict = await Booking.findOne({
    car: car._id,
    status: { $in: ['confirmed', 'active'] },
    $or: [
      { startDate: { $lt: end }, endDate: { $gt: start } }
    ]
  });

  const isAvailable = !conflict;
  const { days: totalDays, price: totalAmount } = calculatePrice(car, start, end);

  let message = `**${car.brand} ${car.model}**\n\n`;
  message += `📅 **Dates:** ${start.toLocaleDateString()} to ${end.toLocaleDateString()}\n`;
  message += `⏱️ **Duration:** ${totalDays} days\n`;
  message += `💰 **Total:** $${totalAmount}\n`;
  message += `✅ **Availability:** ${isAvailable ? '✅ Available!' : '❌ Not Available'}\n\n`;

  if (!isAvailable) {
    message += `This car is already booked for your selected dates. Would you like to search for other available cars?`;
  } else {
    message += `Would you like to book this car?`;
  }

  return {
    message: message,
    structuredData: [{
      type: 'availability',
      car: {
        name: `${car.brand} ${car.model}`,
        available: isAvailable,
        totalAmount: totalAmount,
        totalDays: totalDays
      }
    }]
  };
}

// Get comprehensive database information
async function handleGetDatabaseInfo(user, infoType = 'all') {
  const dbInfo = await getDatabaseInfo(user._id);

  let message = "Here's your current information:\n\n";

  if (infoType === 'all' || infoType === 'bookings') {
    message += "📋 **YOUR BOOKINGS**\n";
    if (dbInfo.userBookings.length === 0) {
      message += "No bookings found.\n\n";
    } else {
      dbInfo.userBookings.forEach(booking => {
        message += `• ID ${booking.id}: ${booking.car} (${booking.dates}) - ${booking.status} - $${booking.amount}\n`;
      });
      message += "\n";
    }
  }

  if (infoType === 'all' || infoType === 'cars') {
    message += "🚗 **AVAILABLE CARS**\n";
    if (dbInfo.availableCars.length === 0) {
      message += "No available cars found.\n\n";
    } else {
      // Show top 5 cars
      dbInfo.availableCars.slice(0, 5).forEach(car => {
        message += `• ${car.name} - $${car.price}/day - ${car.seats} seats - ${car.transmission} - ${car.fuelType}\n`;
      });
      message += `\n...and ${Math.max(0, dbInfo.availableCars.length - 5)} more cars available.\n\n`;
    }
  }

  if (infoType === 'all' || infoType === 'tickets') {
    message += "🎫 **SUPPORT TICKETS**\n";
    if (dbInfo.userTickets.length === 0) {
      message += "No support tickets found.\n";
    } else {
      dbInfo.userTickets.forEach(ticket => {
        message += `• Ticket #${ticket.id}: ${ticket.issue.substring(0, 50)}... - ${ticket.status}\n`;
      });
    }
  }

  return { message };
}

async function handleTicketFlow(user, session, message, step = 'fill') {
  if (step === 'complete') {
    const newTicket = new Ticket({
      user: user._id,
      issue: message,
      conversation: [{ sender: 'user', message: message }]
    });
    await newTicket.save();
    return {
      message: `Thank you. I've created ticket **#${newTicket._id.toString().slice(-6)}** based on your description. Our support team will review it and get back to you soon.`,
      flowComplete: true
    };
  }

  // Start flow from a tool call (issueDescription is NOT passed directly from the tool)
  if (step === 'start') {
    session.flow = 'ticket';
    session.step = 'awaiting_issue';
    session.data = session.data || {}; // Ensure data exists
    return { message: "I'm sorry to hear that. Please describe your issue in one message, and I'll create a support ticket for you." };
  }

  // User is responding with the issue description
  if (session.step === 'awaiting_issue') {
    const issueDescription = message;

    const newTicket = new Ticket({
      user: user._id,
      issue: issueDescription,
      conversation: [{ sender: 'user', message: issueDescription }]
    });
    await newTicket.save();
    resetSession(session);
    return {
      message: `Thank you. I've created ticket **#${newTicket._id.toString().slice(-6)}** based on your description. Our support team will review it and get back to you soon.`,
      flowComplete: true
    };
  }

  // Should not be reached
  return { message: "I'm having trouble with the support ticket flow. Please start over." };
}

// Helper functions for better organization
async function handleCarSelection(session, data, message) {
  const cleanCarQuery = message.replace(/\(\d{4}\)/, '').trim();

  const car = await Car.findOne({
    $or: [
      { name: new RegExp(cleanCarQuery, 'i') },
      { brand: new RegExp(cleanCarQuery, 'i') },
      { model: new RegExp(cleanCarQuery, 'i') },
      {
        $expr: {
          $regexMatch: {
            input: { $concat: ["$brand", " ", "$model"] },
            regex: cleanCarQuery,
            options: "i"
          }
        }
      }
    ],
    available: true
  });

  if (!car) {
    return { message: `Sorry, I couldn't find an available car matching "${message}". Try searching for cars first to see what's available.` };
  }

  data.car = car;
  session.step = 'awaiting_start_date';
  session.data = data; // FIX: Explicitly update session data
  return {
    message: `When would you like to book the ${data.car.brand} ${data.car.model} for? Please provide the pick-up and return dates.`,
    session: session // Return updated session
  };
}

async function handleStartDateSelection(session, data, message) {
  // Try to parse date range (e.g., "2025-11-25 to 2025-11-28")
  const dateRangeMatch = message.match(/(\d{4}-\d{2}-\d{2})\s*(?:to|-)\s*(\d{4}-\d{2}-\d{2})/i);

  if (dateRangeMatch) {
    // User provided both dates at once
    const startDate = parseDate(dateRangeMatch[1]);
    const endDate = parseDate(dateRangeMatch[2]);

    if (!startDate || !endDate) {
      return { message: "I couldn't understand those dates. Please use format like '2025-11-25 to 2025-11-28' or provide dates one at a time." };
    }

    if (endDate <= startDate) {
      return { message: "The drop-off date must be after the pick-up date. Please try again." };
    }

    data.startDate = startDate;
    data.endDate = endDate;

    // Check availability with both dates
    const conflict = await Booking.findOne({
      car: data.car._id,
      status: { $in: ['confirmed', 'active'] },
      $or: [
        { startDate: { $lt: data.endDate }, endDate: { $gt: data.startDate } }
      ]
    });

    if (conflict) {
      resetSession(session);
      return {
        message: `Oh no, the ${data.car.brand} ${data.car.model} is already booked for those dates. Please choose different dates or another car.`,
        flowComplete: true
      };
    }

    return await proceedToLocationStep(session, data);
  } else {
    // Single date provided - assume it's start date
    const startDate = parseDate(message);
    if (!startDate) {
      return { message: "Sorry, that's not a valid start date. Please use 'tomorrow', 'YYYY-MM-DD', or provide both dates like '2025-11-25 to 2025-11-28'." };
    }
    data.startDate = startDate;
    session.step = 'awaiting_end_date';
    session.data = data; // FIX: Explicitly update session data
    return {
      message: `Got it. Pick-up is ${data.startDate.toLocaleDateString()}. What day will you be dropping it off?`,
      session: session // Return updated session
    };
  }
}

async function handleEndDateSelection(session, data, message) {
  const endDate = parseDate(message);
  if (!endDate || endDate <= data.startDate) {
    return { message: "The drop-off date must be a valid date after the pick-up date. Please try again." };
  }
  data.endDate = endDate;

  // Check availability
  const conflict = await Booking.findOne({
    car: data.car._id,
    status: { $in: ['confirmed', 'active'] },
    $or: [
      { startDate: { $lt: data.endDate }, endDate: { $gt: data.startDate } }
    ]
  });

  if (conflict) {
    resetSession(session);
    return {
      message: `Oh no, the ${data.car.brand} ${data.car.model} is already booked for those dates. Please choose different dates or another car.`,
      flowComplete: true
    };
  }

  return await proceedToLocationStep(session, data);
}

async function proceedToLocationStep(session, data) {
  // Calculate days and amount
  const { days: totalDays, price: totalAmount } = calculatePrice(data.car, data.startDate, data.endDate);
  data.totalDays = totalDays;
  data.totalAmount = totalAmount;

  session.step = 'awaiting_pickup_location';
  session.data = data; // FIX: Explicitly update session data
  return {
    message: `Perfect! I have:\n- **Car:** ${data.car.brand} ${data.car.model}\n- **Dates:** ${data.startDate.toLocaleDateString()} to ${data.endDate.toLocaleDateString()}\n- **Total:** $${totalAmount} for ${totalDays} days\n\nWhere would you like to pick up the car?`,
    session: session // Return updated session
  };
}

// FIXED: handlePickupLocation now properly returns the updated session
async function handlePickupLocation(session, data, message) {
  console.log('DEBUG: handlePickupLocation - Received message:', message);

  if (!message || message.trim() === '') {
    return {
      message: "Please provide the name of the pick-up location or address. (e.g., 'Airport Terminal A' or '123 Main Street')",
      session: session // Return session even on error
    };
  }

  // Store the pickup location
  data.pickupLocation = message.trim();
  session.step = 'awaiting_dropoff_location';
  session.data = data;

  console.log('DEBUG: handlePickupLocation - Updated step to:', session.step);
  console.log('DEBUG: handlePickupLocation - Pickup location:', data.pickupLocation);

  // CRITICAL FIX: Return the updated session to persist the state change
  return {
    message: "Got it! Pickup location set to: " + data.pickupLocation + "\n\nAnd where will you drop off the car?",
    session: session // This ensures the session updates are persisted
  };
}

// FIXED: handleDropoffLocation now returns the updated session
async function handleDropoffLocation(session, data, message) {
  console.log('DEBUG: handleDropoffLocation - Received message:', message);

  if (!message || message.trim() === '') {
    return {
      message: "Please provide the name of the drop-off location or address. (e.g., 'Downtown Office' or '456 Oak Ave')",
      session: session // Return session even on error
    };
  }

  // Store the dropoff location
  data.dropoffLocation = message.trim();

  // Move to confirmation step
  session.step = 'awaiting_confirmation';
  session.data = data;

  const confirmationMessage = `OK, final check:\n\n` +
    `🚗 **Car:** ${data.car.brand} ${data.car.model}\n` +
    `📅 **Dates:** ${data.startDate.toLocaleDateString()} to ${data.endDate.toLocaleDateString()}\n` +
    `📍 **Pickup:** ${data.pickupLocation}\n` +
    `📍 **Dropoff:** ${data.dropoffLocation}\n` +
    `💰 **Total:** **$${data.totalAmount}** (${data.totalDays} days)\n\n` +
    `Would you like to confirm this booking?`;

  return {
    message: confirmationMessage,
    session: session // CRITICAL FIX: Return updated session
  };
}


async function handleBookingConfirmation(session, data, message) {
  if (message.toLowerCase().includes('yes') || message.toLowerCase().includes('confirm')) {
    const bookingResult = await createBooking(
      data.userId,
      data.car,
      data.startDate,
      data.endDate,
      data.totalDays,
      data.totalAmount,
      data.pickupLocation,
      data.dropoffLocation
    );
    resetSession(session);
    return {
      message: bookingResult.message,
      flowComplete: true,
      session: session // Return session even when resetting
    };
  } else if (message.toLowerCase().includes('no') || message.toLowerCase().includes('cancel')) {
    resetSession(session);
    return {
      message: `Booking cancelled. Let me know if you need anything else!`,
      flowComplete: true,
      session: session // Return session even when resetting
    };
  }
  return {
    message: 'Please confirm the booking with "Yes" or cancel with "No".',
    session: session // Return session for consistency
  };
}

// Fixed Booking Flow Function
async function handleBookingFlow(user, session, message, step = 'fill', initialArgs = {}) {
  const data = session.data || {};
  data.userId = user._id;

  // 1. Initial Data check and setup
  if (session.step === 'start') {
    session.flow = 'booking';
    session.data = data; // FIX: Ensure data is set in session

    // Handle initial arguments from the tool call
    if (initialArgs.carName) {
      const car = await Car.findOne({
        $or: [
          { name: new RegExp(initialArgs.carName, 'i') },
          { brand: new RegExp(initialArgs.carName, 'i') },
          { model: new RegExp(initialArgs.carName, 'i') },
          {
            $expr: {
              $regexMatch: {
                input: { $concat: ["$brand", " ", "$model"] },
                regex: initialArgs.carName,
                options: "i"
              }
            }
          }
        ],
        available: true
      });
      if (car) {
        data.car = car;
        console.log(`Found car from initial args: ${car.brand} ${car.model}`);
      }
    }

    // Check if we have both dates from initial args
    if (initialArgs.startDate) data.startDate = parseDate(initialArgs.startDate);
    if (initialArgs.endDate) data.endDate = parseDate(initialArgs.endDate);

    // Determine next step
    if (!data.car) {
      session.step = 'awaiting_car';
      session.data = data; // FIX: Update session data
      return {
        message: "Which car would you like to book? Please provide the brand and model.",
        session: session
      };
    } else if (!data.startDate) {
      session.step = 'awaiting_start_date';
      session.data = data; // FIX: Update session data
      return {
        message: `When would you like to book the ${data.car.brand} ${data.car.model} for? Please provide the pick-up and return dates.`,
        session: session
      };
    } else if (!data.endDate) {
      session.step = 'awaiting_end_date';
      session.data = data; // FIX: Update session data
      return {
        message: `Pick-up is ${data.startDate.toLocaleDateString()}. What day will you be dropping it off?`,
        session: session
      };
    } else {
      // We have car and both dates, proceed to location
      return await proceedToLocationStep(session, data);
    }
  }


  // 2. Step-by-step processing
  switch (session.step) {
    case 'awaiting_car':
      return await handleCarSelection(session, data, message);

    case 'awaiting_start_date':
      return await handleStartDateSelection(session, data, message);

    case 'awaiting_end_date':
      return await handleEndDateSelection(session, data, message);

    case 'awaiting_pickup_location':
      return await handlePickupLocation(session, data, message);

    case 'awaiting_dropoff_location':
      return await handleDropoffLocation(session, data, message);

    case 'awaiting_confirmation':
      return await handleBookingConfirmation(session, data, message);

    default:
      resetSession(session);
      return {
        message: "I got lost in the booking flow. Let's start over.",
        session: session
      };
  }
}

async function handleCancelFlow(user, session, message, step = 'fill', initialArgs = {}) {
  const data = session.data || {};
  data.userId = user._id;

  // Initialize flow state only at the start
  if (session.step === 'start') {
    session.flow = 'cancel';
    session.step = 'awaiting_id';
    session.data = data;

    if (initialArgs.bookingIdOrCarName) {
      message = initialArgs.bookingIdOrCarName;
    } else {
      return {
        message: "To cancel a booking, please provide the **Booking ID** (last 8 digits) or the name of the car you booked.",
        session: session
      };
    }
  }

  if (session.step === 'awaiting_id') {
    const isId = message.match(/^[a-f0-9]{8}$/i);
    let booking;

    if (isId) {
      const bookings = await Booking.find({ user: user._id, status: { $in: ['pending', 'confirmed', 'active'] } })
        .populate('car');
      booking = bookings.find(b => b._id.toString().slice(-8).toUpperCase() === message.toUpperCase());
    } else {
      const car = await Car.findOne({ $or: [{ name: new RegExp(message, 'i') }, { brand: new RegExp(message, 'i') }, { model: new RegExp(message, 'i') }] });
      if (car) {
        booking = await Booking.findOne({ user: user._id, car: car._id, status: { $in: ['pending', 'confirmed', 'active'] } }).populate('car');
      }
    }

    if (!booking) {
      return {
        message: `I couldn't find an active booking for "**${message}**". Please try the Booking ID or a car name you rented.`,
        session: session
      };
    }

    data.booking = booking;
    session.step = 'awaiting_confirmation';
    session.data = data; // FIX: Update session data
    return {
      message: `I found your booking for the ${booking.car.brand} ${booking.car.model} (ID: ${booking._id.toString().slice(-8)}). Are you sure you want to cancel this booking? Say **'Yes'** or **'No'**.`,
      session: session
    };
  }

  if (session.step === 'awaiting_confirmation') {
    if (message.toLowerCase().includes('yes')) {
      const cancelledBooking = await Booking.findByIdAndUpdate(
        data.booking._id,
        { status: 'cancelled' },
        { new: true }
      );

      // Make the car available again
      await Car.findByIdAndUpdate(data.booking.car._id, { available: true });
      resetSession(session);

      return {
        message: `Booking **#${data.booking._id.toString().slice(-8)}** for the ${data.booking.car.brand} ${data.booking.car.model} has been successfully **cancelled**.`,
        flowComplete: true,
        session: session
      };
    } else if (message.toLowerCase().includes('no')) {
      resetSession(session);
      return {
        message: "Cancellation stopped. Your booking remains active.",
        flowComplete: true,
        session: session
      };
    } else {
      return {
        message: "Please confirm with 'Yes' or 'No'.",
        session: session
      };
    }
  }
}


async function handleEditBookingFlow(user, session, message, step = 'fill', initialArgs = {}) {
  const data = session.data || {};
  data.userId = user._id;

  if (session.step === 'start') {
    session.flow = 'edit_dates';
    session.step = 'awaiting_id';
    session.data = data; // FIX: Ensure data is set in session

    // Check for initial argument from tool call
    if (initialArgs.bookingIdOrCarName) {
      message = initialArgs.bookingIdOrCarName;
    } else {
      return {
        message: "To edit a booking, please provide the **Booking ID** (last 6 digits) or the name of the car you booked.",
        session: session
      };
    }
  }

  // Step 1: Get Booking ID/Car Name
  if (session.step === 'awaiting_id') {
    const isId = message.match(/^[a-f0-9]{8}$/i);
    let booking;

    if (isId) {
      const bookings = await Booking.find({ user: user._id, status: { $in: ['pending', 'confirmed', 'active'] } })
        .populate('car');
      booking = bookings.find(b => b._id.toString().slice(-8).toUpperCase() === message.toUpperCase());
    } else {
      const car = await Car.findOne({ $or: [{ name: new RegExp(message, 'i') }, { brand: new RegExp(message, 'i') }, { model: new RegExp(message, 'i') }] });
      if (car) {
        booking = await Booking.findOne({ user: user._id, car: car._id, status: { $in: ['pending', 'confirmed', 'active'] } }).populate('car');
      }
    }

    if (!booking) {
      return {
        message: `I couldn't find an active booking for "**${message}**". Please try the Booking ID or a car name you rented.`,
        session: session
      };
    }

    data.booking = booking;
    session.step = 'awaiting_new_start_date';
    session.data = data; // FIX: Update session data
    return {
      message: `You are editing booking **${booking._id.toString().slice(-8)}** for the ${booking.car.brand} ${booking.car.model}. What is the **new pick-up date**? (Current: ${booking.startDate.toLocaleDateString()})`,
      session: session
    };
  }

  // Step 2: Get New Start Date
  if (session.step === 'awaiting_new_start_date') {
    const newStartDate = parseDate(message);
    if (!newStartDate) {
      return {
        message: "Sorry, that's not a valid date. Please use 'tomorrow' or 'YYYY-MM-DD'.",
        session: session
      };
    }
    data.newStartDate = newStartDate;
    session.step = 'awaiting_new_end_date';
    session.data = data; // FIX: Update session data
    return {
      message: `Got it. And what is the **new drop-off date**? (Current: ${data.booking.endDate.toLocaleDateString()})`,
      session: session
    };
  }

  // Step 3: Get New End Date
  if (session.step === 'awaiting_new_end_date') {
    const newEndDate = parseDate(message);
    if (!newEndDate || newEndDate <= data.newStartDate) {
      return {
        message: "The new drop-off date must be a valid date *after* the new pick-up date. Please try again.",
        session: session
      };
    }
    data.newEndDate = newEndDate;

    // Check new date availability
    const conflict = await Booking.findOne({
      car: data.booking.car._id,
      status: { $in: ['confirmed', 'active'] },
      _id: { $ne: data.booking._id }, // Exclude current booking
      $or: [
        { startDate: { $lt: data.newEndDate }, endDate: { $gt: data.newStartDate } }
      ]
    });

    if (conflict) {
      // Reset flow if the new dates conflict with another booking
      resetSession(session);
      return {
        message: `The ${data.booking.car.brand} ${data.booking.car.model} is **not available** on the new dates you selected. Please try a new set of dates or a different car.`,
        flowComplete: true,
        session: session
      };
    }

    const { days: newTotalDays, price: newTotalAmount } = calculatePrice(data.booking.car, data.newStartDate, data.newEndDate);
    data.newTotalDays = newTotalDays;
    data.newTotalAmount = newTotalAmount;

    session.step = 'awaiting_edit_confirmation';
    session.data = data; // FIX: Update session data
    return {
      message: `The new dates are from **${data.newStartDate.toLocaleDateString()}** to **${data.newEndDate.toLocaleDateString()}**. The total price is **$${newTotalAmount}**. Do you want to confirm this edit?`,
      session: session
    };
  }

  // Step 4: Final Confirmation
  if (session.step === 'awaiting_edit_confirmation') {
    if (message.toLowerCase().includes('yes')) {
      const updatedBooking = await Booking.findByIdAndUpdate(
        data.booking._id,
        {
          startDate: data.newStartDate,
          endDate: data.newEndDate,
          totalDays: data.newTotalDays,
          totalAmount: data.newTotalAmount,
        },
        { new: true }
      );

      resetSession(session);
      return {
        message: `Booking **#${updatedBooking._id.toString().slice(-8)}** has been successfully updated! New dates: ${updatedBooking.startDate.toLocaleDateString()} to ${updatedBooking.endDate.toLocaleDateString()}. New total: $${updatedBooking.totalAmount}.`,
        flowComplete: true,
        session: session
      };
    } else if (message.toLowerCase().includes('no')) {
      resetSession(session);
      return {
        message: "Edit flow stopped. Your booking remains unchanged.",
        flowComplete: true,
        session: session
      };
    } else {
      return {
        message: "Please confirm with 'Yes' or 'No'.",
        session: session
      };
    }
  }
}

async function handleGetBookings(user, bookingId) {
  if (bookingId) {
    const bookings = await Booking.find({ user: user._id })
      .populate('car')
      .sort({ createdAt: -1 });
    const booking = bookings.find(b => b._id.toString().slice(-8).toUpperCase() === bookingId.toUpperCase());

    if (!booking) {
      return { message: `I couldn't find a booking with ID **${bookingId}** for your account.` };
    }

    const statusText = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
    return {
      message: `Booking Details (ID: **${bookingId}**): - **Car:** ${booking.car.brand} ${booking.car.model} - **Dates:** ${booking.startDate.toLocaleDateString()} to ${booking.endDate.toLocaleDateString()} - **Total Paid:** $${booking.totalAmount} - **Status:** **${statusText}**`
    };
  } else {
    const upcomingBookings = await Booking.find({ user: user._id, status: { $in: ['pending', 'confirmed', 'active'] } })
      .populate('car')
      .sort({ startDate: 1 })
      .limit(5);

    if (upcomingBookings.length === 0) {
      return { message: "You currently have no active or upcoming bookings. Why don't you **search for a car** to get started?" };
    }

    let message = `Here are your ${upcomingBookings.length} upcoming booking(s):\n`;
    upcomingBookings.forEach(booking => {
      message += `\n• **ID ${booking._id.toString().slice(-8)}**: ${booking.car.brand} ${booking.car.model} (${booking.startDate.toLocaleDateString()} to ${booking.endDate.toLocaleDateString()}) - Status: ${booking.status}`;
    });
    return { message };
  }
}

async function handleGetQuote(carName, startDate, endDate) {
  const car = await Car.findOne({
    $or: [
      { name: new RegExp(carName, 'i') },
      { brand: new RegExp(carName, 'i') },
      { model: new RegExp(carName, 'i') }
    ],
    available: true
  }).select('name brand model price');

  if (!car) {
    return { message: `Sorry, I couldn't find the car **${carName}** in our available inventory.` };
  }

  const pricePerDay = car.price;
  let message = `The daily rate for the **${car.brand} ${car.model}** is **$${pricePerDay}**.`;

  if (startDate && endDate) {
    const start = parseDate(startDate);
    const end = parseDate(endDate);

    if (start && end && end > start) {
      const { days: totalDays, price: totalAmount } = calculatePrice(car, start, end);

      message += `\nFor ${totalDays} days (${start.toLocaleDateString()} to ${end.toLocaleDateString()}):\n- **Daily Rate:** $${pricePerDay}\n- **Estimated Total:** **$${totalAmount}**\n\nReady to **book**?`;
    } else {
      message += `\nI couldn't calculate a quote because the dates provided were invalid.`;
    }
  } else if (startDate || endDate) {
    message += "\nTo calculate a total price, please provide both a start date and an end date.";
  }

  return { message };
}

async function handleInitiatePayment(user, bookingId) {
  try {
    // Get user's bookings and find the one matching the last 8 digits
    const bookings = await Booking.find({ user: user._id }).populate('car');
    const booking = bookings.find(b => 
      b._id.toString().slice(-8).toLowerCase() === bookingId.toLowerCase()
    );

    if (!booking) {
      return { 
        message: `❌ I couldn't find booking **#${bookingId}** for your account. Please verify the booking ID.` 
      };
    }

    // Check payment status
    if (booking.paymentStatus === 'paid') {
      return { 
        message: `✅ Booking **#${bookingId}** has already been paid! No further payment is required.\n\n🚗 **${booking.car.brand} ${booking.car.model}**\n📅 ${booking.startDate.toLocaleDateString()} - ${booking.endDate.toLocaleDateString()}\n💰 **$${booking.totalAmount}** (Paid on ${booking.paidAt?.toLocaleDateString()})`
      };
    }

    if (booking.status === 'cancelled') {
      return { 
        message: `❌ Booking **#${bookingId}** is cancelled and cannot be paid for.` 
      };
    }

    // Return payment guidance
    return {
      message: `💳 To make payment for booking **#${bookingId}**, please:\n\n1. Go to **My Bookings** page\n2. Find booking **#${bookingId}** \n3. Click **"Pay Now"** button\n4. Complete checkout\n\n🚗 **${booking.car.brand} ${booking.car.model}**\n💰 **Amount: $${booking.totalAmount}**\n\nWould you like help with anything else?`
    };

  } catch (error) {
    console.error('Payment initiation error:', error);
    return { 
      message: `❌ An error occurred while processing your payment request. Please try again or contact support.` 
    };
  }
}

async function getAiAction(userMessage, history, session) {
  const chatHistory = history.map(msg => ({ role: msg.sender === 'user' ? 'user' : 'model', parts: [{ text: msg.message }] }));
  chatHistory.push({ role: 'user', parts: [{ text: userMessage }] });

  // Get current database state for AI context
  const dbInfo = await getDatabaseInfo(session.user._id);

  const systemInstruction = `You are a helpful and professional car rental assistant with DIRECT ACCESS to the live database.

CRITICAL RULES:
1. Booking IDs are ALWAYS 8 characters long (e.g., d01b979f)
2. When user mentions "cancel booking id XYZ", immediately use manage_booking with action: 'cancel'
3. If session.flow !== 'none', process as continuation of current step
4. Convert all dates to 'YYYY-MM-DD' format

  CURRENT DATABASE STATE:
  - Available Cars: ${dbInfo.availableCars.length} cars in inventory
  - User Bookings: ${dbInfo.userBookings.length} bookings found
  - Support Tickets: ${dbInfo.userTickets.length} tickets
  
  USER CONTEXT: ${session.user.name} (ID: ${session.user._id})
  CURRENT FLOW STATE: ${session.flow}
  
  CRITICAL RULES:
  1. If the message is a simple greeting (like 'hi', 'hello'), use 'respond_naturally'
  2. If Current Flow State is NOT 'none', treat user's message as response to current step - use 'respond_naturally'
  3. You have DIRECT DATABASE ACCESS - use the appropriate tools to get real-time information
  4. For car searches, availability checks, or booking inquiries, use the database tools
  5. Date Format: Convert any date mentioned into 'YYYY-MM-DD' format
  
  DATABASE CAPABILITIES:
  - search_car: Find available cars with filters
  - get_car_details: Get detailed specs of any car
  - get_my_bookings: View user's bookings with status filters
  - check_availability: Verify if a car is available for specific dates
  - get_database_info: Get comprehensive overview of user's data

  Use your database access to provide accurate, real-time information!`;

  try {
    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: chatHistory,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ functionDeclarations: availableTools }]
      }
    });

    const functionCall = response.candidates?.[0]?.content?.parts?.[0]?.functionCall;

    if (functionCall) {
      const action = functionCall.name;
      const args = functionCall.args;
      return { action, args };
    }

    const textResponse = response.text;
    return { action: 'respond_naturally', args: { message: textResponse } };

  } catch (error) {
    console.error("AI Generation Error:", error);
    return { action: 'respond_naturally', args: { message: "I'm having a technical issue right now. Could you please try again?" } };
  }
}

app.post('/api/chatbot/message', authenticateToken, async (req, res) => {
  try {
    const { message: userMessage, history: chatHistory } = req.body;
    const userId = req.user.userId;

    // Initialize or get session
    if (!chatSessions[userId]) {
      const user = await User.findById(userId).select('name email');
      if (!user) {
        return res.status(404).json({ response: "User not found." });
      }
      chatSessions[userId] = {
        user: { _id: userId, name: user.name, email: user.email },
        flow: 'none',
        step: 'start',
        data: {},
      };
    }

    const session = chatSessions[userId];

    console.log('DEBUG - BEFORE processing - Flow:', session.flow, 'Step:', session.step);

    let botResponse = {};

    // STRATEGY: If we're in an active flow, skip AI analysis and continue the flow directly
    if (session.flow !== 'none') {
      console.log('DEBUG - Continuing existing flow:', session.flow, 'Step:', session.step);

      try {
        switch (session.flow) {
          case 'booking':
            botResponse = await handleBookingFlow(session.user, session, userMessage);
            break;
          case 'cancel':
            botResponse = await handleCancelFlow(session.user, session, userMessage, session.step);
            break;
          case 'edit_dates':
            botResponse = await handleEditBookingFlow(session.user, session, userMessage, session.step);
            break;
          case 'ticket':
            botResponse = await handleTicketFlow(session.user, session, userMessage);
            break;
          case 'initiate_payment':
  botResponse = await handleInitiatePayment(session.user, args.bookingId);
  break;
          default:
            resetSession(session);
            botResponse = { message: "I got confused. Let's start over." };
        }

        // Update session in global store after flow processing
        if (botResponse.session) {
          chatSessions[userId] = botResponse.session;
        } else {
          chatSessions[userId] = session;
        }

        if (botResponse.flowComplete) {
          resetSession(session);
          chatSessions[userId] = session;
        }

      } catch (flowError) {
        console.error('Error in flow processing:', flowError);
        resetSession(session);
        chatSessions[userId] = session;
        botResponse = {
          message: "I encountered an error in our conversation. Let's start over. How can I help you?"
        };
      }

    } else {
      // Only use AI when no flow is active
      let action = 'respond_naturally';
      let args = {};

      try {
        // Only call AI if we have the API key
        if (process.env.GEMINI_API_KEY) {
          const aiResult = await getAiAction(userMessage, chatHistory, session);
          action = aiResult.action;
          args = aiResult.args || {};
        } else {
          // Fallback: Simple keyword matching if AI is disabled
          const lowerMessage = userMessage.toLowerCase();
          if (lowerMessage.includes('search') || lowerMessage.includes('find') || lowerMessage.includes('car')) {
            action = 'search_car';
            args = { query: userMessage.replace(/search|find|for|cars?/gi, '').trim() || 'cars' };
          } else if (lowerMessage.includes('book') || lowerMessage.includes('rent')) {
            action = 'start_booking';
            args = { carName: userMessage.replace(/book|rent|a|the/gi, '').trim() };
          } else if (lowerMessage.includes('booking') || lowerMessage.includes('my booking')) {
            action = 'get_my_bookings';
          } else {
            action = 'respond_naturally';
            args = { message: "I can help you search for cars, book vehicles, or check your existing bookings. What would you like to do?" };
          }
        }

        console.log('DEBUG - AI Action:', action, 'Args:', args);

        // Fix for greetings being mistaken for search queries
        const greetingRegex = /^(hi+|hello|hey|yo|greetings|hii|wassup|h+)$/i;
        if (action === 'search_car' && args.query && greetingRegex.test(args.query.trim())) {
          action = 'respond_naturally';
          args = { message: "Hello! I'm your car rental assistant. How can I help you today? I can show you available cars, help with bookings, or check your existing reservations." };
        }

      } catch (aiError) {
        console.error('AI Analysis Error:', aiError);
        // Fallback to simple response
        action = 'respond_naturally';
        args = { message: "I'm here to help with car rentals! You can search for cars, make bookings, or check your existing reservations. What would you like to do?" };
      }

      // Execute the tool call
      try {
        switch (action) {
          case 'search_car':
            botResponse = await handleCarSearch(args.query, args.filters || {});
            break;
          case 'get_car_details':
            botResponse = await handleGetCarDetails(args.carName);
            break;
          case 'get_my_bookings':
            botResponse = await handleGetMyBookings(session.user, args.status);
            break;
          case 'check_availability':
            botResponse = await handleCheckAvailability(args.carName, args.startDate, args.endDate);
            break;
          case 'get_database_info':
            botResponse = await handleGetDatabaseInfo(session.user, args.infoType);
            break;
          case 'start_booking':
            botResponse = await handleBookingFlow(session.user, session, userMessage, 'fill', args);
            break;
          case 'manage_booking':
            if (args.action === 'cancel') {
              botResponse = await handleCancelFlow(session.user, session, args.bookingIdOrCarName ? userMessage : '', 'fill', args);
            } else if (args.action === 'edit_dates') {
              botResponse = await handleEditBookingFlow(session.user, session, args.bookingIdOrCarName ? userMessage : '', 'fill', args);
            } else {
              botResponse = { message: `I'm not sure how to perform the action: **${args.action}**.` };
            }
            break;
          case 'raise_ticket':
            if (args.issueDescription) {
              botResponse = await handleTicketFlow(session.user, session, args.issueDescription, 'complete');
            } else {
              botResponse = await handleTicketFlow(session.user, session, userMessage, 'start');
            }
            break;
          case 'get_bookings':
            botResponse = await handleGetBookings(session.user, args.bookingId);
            break;
          case 'get_quote':
            botResponse = await handleGetQuote(args.carName, args.startDate, args.endDate);
            break;
            case 'initiate_payment':  
  botResponse = await handleInitiatePayment(session.user, args.bookingId);
  break;
          case 'respond_naturally':
          default:
            botResponse = { message: args.message || "I can help you with car rentals! Try asking me to search for cars, make a booking, or check your existing reservations." };
            break;
        }

        // Update session in global store after tool execution
        if (botResponse.session) {
          chatSessions[userId] = botResponse.session;
        } else {
          chatSessions[userId] = session;
        }

      } catch (toolError) {
        console.error('Tool execution error:', toolError);
        botResponse = {
          message: "I encountered an error while processing your request. Please try again or rephrase your question."
        };
      }
    }

    console.log('DEBUG - AFTER processing - Flow:', session.flow, 'Step:', session.step);

    const responseBody = {
      response: botResponse.message || "How can I assist you with car rentals today?",
      structuredData: botResponse.structuredData || null,
      type: botResponse.type || 'text',
      flow: session.flow,
      step: session.step
    };

    res.json(responseBody);

  } catch (error) {
    console.error('Fatal error in chatbot endpoint:', error);
    res.status(500).json({
      response: "I'm experiencing technical difficulties. Please try again in a moment.",
      structuredData: null,
      type: 'text',
      flow: 'none',
      step: 'start'
    });
  }
});

// Simple fallback AI function
async function getSimpleAIResponse(userMessage) {
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('search') || lowerMessage.includes('find') || lowerMessage.includes('car') || lowerMessage.includes('toyota')) {
    return {
      action: 'search_car',
      args: { query: userMessage.replace(/search|find|for|cars?/gi, '').trim() || 'cars' }
    };
  }
  else if (lowerMessage.includes('book') || lowerMessage.includes('rent')) {
    return {
      action: 'start_booking',
      args: { carName: userMessage.replace(/book|rent|a|the/gi, '').trim() }
    };
  }
  else if (lowerMessage.includes('booking') || lowerMessage.includes('my booking')) {
    return { action: 'get_my_bookings', args: {} };
  }
  else if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
    return {
      action: 'respond_naturally',
      args: { message: "Hello! I'm your car rental assistant. I can help you search for cars, make bookings, or manage your existing reservations." }
    };
  }
  else {
    return {
      action: 'respond_naturally',
      args: { message: "I can help you with car rentals! Try asking me to search for cars, make a booking, or check your existing reservations." }
    };
  }
}

// --- START: NEW CHAT ENDPOINT FOR MEMORY CLEAR ---

app.post('/api/chatbot/new-chat', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  if (chatSessions[userId]) {
    // Explicitly delete the session entry for a clean start
    delete chatSessions[userId];
  }
  return res.status(200).json({ message: "Chat session cleared." });
});
// --- END: NEW CHAT ENDPOINT FOR MEMORY CLEAR ---


// Add this temporary route to update existing cars
app.post('/api/update-car-types', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const cars = await Car.find({ carType: { $exists: false } });

    const typeMapping = {
      'tesla': 'luxury',
      'bmw': 'luxury',
      'mercedes': 'luxury',
      'audi': 'luxury',
      'lexus': 'luxury',
      'honda': 'economy',
      'toyota': 'economy',
      'hyundai': 'economy',
      'kia': 'economy',
      'ford': 'sedan',
      'chevrolet': 'sedan',
      'nissan': 'sedan',
      'rav4': 'suv',
      'cr-v': 'suv',
      'explorer': 'suv',
      'mustang': 'sports',
      'corvette': 'sports',
      'porsche': 'sports'
    };

    let updatedCount = 0;

    for (const car of cars) {
      let carType = 'sedan'; // default

      // Determine type based on brand/model
      const lowerBrand = car.brand.toLowerCase();
      const lowerModel = car.model.toLowerCase();
      const lowerName = car.name.toLowerCase();

      for (const [key, value] of Object.entries(typeMapping)) {
        if (lowerBrand.includes(key) || lowerModel.includes(key) || lowerName.includes(key)) {
          carType = value;
          break;
        }
      }

      // Update the car with the determined type
      await Car.findByIdAndUpdate(car._id, { carType });
      updatedCount++;
    }

    res.json({
      message: `Updated ${updatedCount} cars with car types`,
      updated: updatedCount
    });

  } catch (error) {
    res.status(500).json({ message: 'Migration failed', error: error.message });
  }
});

// Payment Routes
app.post('/api/payments/create-intent', authenticateToken, async (req, res) => {
  try {
    const { bookingId, amount } = req.body;
    
    const booking = await Booking.findById(bookingId)
      .populate('car')
      .populate('user', 'name email');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // In a real implementation, you would integrate with Stripe/PayPal here
    // For demo purposes, we'll simulate payment intent creation
    const paymentIntent = {
      id: `pi_${Math.random().toString(36).substr(2, 9)}`,
      client_secret: `pi_${Math.random().toString(36).substr(2, 24)}_secret_${Math.random().toString(36).substr(2, 24)}`,
      amount: amount * 100, // amount in cents
      currency: 'usd'
    };

    // Update booking with payment intent
    await Booking.findByIdAndUpdate(bookingId, {
      paymentIntentId: paymentIntent.id,
      paymentStatus: 'processing'
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount
    });
  } catch (error) {
    res.status(500).json({ message: 'Payment error', error: error.message });
  }
});

app.post('/api/payments/confirm', authenticateToken, async (req, res) => {
  try {
    const { bookingId, paymentIntentId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // In real implementation, verify with payment provider
    // For demo, we'll simulate successful payment
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        paymentStatus: 'paid',
        paymentIntentId: paymentIntentId,
        status: 'confirmed', // Change booking status to confirmed
        paidAt: new Date()
      },
      { new: true }
    ).populate('car').populate('user');

    // Update car availability
    await Car.findByIdAndUpdate(booking.car, { available: false });

    res.json({
      success: true,
      booking: updatedBooking,
      message: 'Payment successful! Booking confirmed.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Payment confirmation failed', error: error.message });
  }
});

app.post('/api/payments/cancel', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Update booking status
    await Booking.findByIdAndUpdate(bookingId, {
      paymentStatus: 'cancelled',
      status: 'cancelled'
    });

    // Make car available again
    await Car.findByIdAndUpdate(booking.car, { available: true });

    res.json({
      success: true,
      message: 'Payment cancelled. Booking has been cancelled.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Cancellation failed', error: error.message });
  }
});

// Forgot Password - Send OTP
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // For security, don't reveal if email exists or not
      return res.json({ 
        message: 'If the email exists, an OTP has been sent',
        otp: null // In production, don't send OTP back
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    otpStore.set(email, { otp, expiresAt, userId: user._id });

    // In production: Send email with OTP
    // For demo: Return OTP in response
    res.json({
      message: 'If the email exists, an OTP has been sent',
      otp: otp, // Remove this in production
      expiresIn: '10 minutes'
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify OTP and Reset Password
app.post('/api/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        message: 'Email, OTP and new password are required' 
      });
    }

    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    const otpData = otpStore.get(email);
    
    if (!otpData) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Check if OTP is expired
    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Find user
    const user = await User.findById(otpData.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    // Clear OTP after successful reset
    otpStore.delete(email);

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Resend OTP
app.post('/api/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // For security, don't reveal if email exists or not
      return res.json({ 
        message: 'If the email exists, a new OTP has been sent',
        otp: null
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Update OTP
    otpStore.set(email, { otp, expiresAt, userId: user._id });

    res.json({
      message: 'If the email exists, a new OTP has been sent',
      otp: otp, // Remove this in production
      expiresIn: '10 minutes'
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Partner Routes

// Generate OTP for partner registration
app.post('/api/generate-partner-otp', authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    partnerOtpStore.set(email, { otp, expiresAt, userId: req.user.userId });

    res.json({
      message: 'OTP generated successfully',
      otp: otp, // Remove this in production
      expiresIn: '10 minutes'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Resend partner OTP
app.post('/api/resend-partner-otp', authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    partnerOtpStore.set(email, { otp, expiresAt, userId: req.user.userId });

    res.json({
      message: 'OTP resent successfully',
      otp: otp, // Remove this in production
      expiresIn: '10 minutes'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Become partner endpoint
app.post('/api/become-partner', authenticateToken, async (req, res) => {
  try {
    const { address, city, state, country, zipCode, nationalId, idProof, otp } = req.body;
    const userId = req.user.userId;

    // Check if user is already a partner
    const existingPartner = await Partner.findOne({ user: userId });
    if (existingPartner) {
      return res.status(400).json({ message: 'You are already a partner' });
    }

    // Verify OTP
    const user = await User.findById(userId);
    const otpData = partnerOtpStore.get(user.email);
    
    if (!otpData || otpData.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (Date.now() > otpData.expiresAt) {
      partnerOtpStore.delete(user.email);
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Create partner application
    const partner = new Partner({
      user: userId,
      address,
      city,
      state,
      country,
      zipCode,
      nationalId,
      idProof,
      status: 'pending'
    });

    await partner.save();

    // Create user directories
    createPartnerDirectories(userId);

    // Clear OTP
    partnerOtpStore.delete(user.email);

    res.json({
      message: 'Partner application submitted successfully! Waiting for admin approval.',
      partnerId: partner._id
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload partner document
app.post('/api/upload-partner-doc', authenticateToken, uploadPartnerDoc.single('document'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const relativePath = `/user/${req.user.userId}/${req.file.filename}`;
    res.status(201).json({
      message: 'Document uploaded successfully',
      url: `http://localhost:${PORT}${relativePath}`,
      path: relativePath
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// Upload partner car image
app.post('/api/upload-partner-car-image', authenticateToken, uploadPartnerCarImage.single('carImage'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const relativePath = `/user/${req.user.userId}/uploads/${req.file.filename}`;
    res.status(201).json({
      message: 'Image uploaded successfully',
      url: `http://localhost:${PORT}${relativePath}`,
      path: relativePath
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// Partner car management
app.get('/api/partner/cars', authenticateToken, async (req, res) => {
  try {
    const cars = await Car.find({ partner: req.user.userId }).sort({ createdAt: -1 });
    res.json({ cars });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/partner/cars', authenticateToken, async (req, res) => {
  try {
    // Check if user is an approved partner
    const partner = await Partner.findOne({ user: req.user.userId, status: 'approved' });
    if (!partner) {
      return res.status(403).json({ message: 'You are not an approved partner' });
    }

    const car = new Car({
      ...req.body,
      partner: req.user.userId,
      isPartnerCar: true,
      adminDeactivated: false // New cars are not admin deactivated
    });

    await car.save();
    res.status(201).json(car);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and OTP are required' 
      });
    }

    const otpData = otpStore.get(email);
    
    if (!otpData) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired OTP' 
      });
    }

    // Check if OTP is expired
    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ 
        success: false,
        message: 'OTP has expired' 
      });
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid OTP' 
      });
    }

    // OTP is valid
    res.json({ 
      success: true,
      message: 'OTP verified successfully' 
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});


app.put('/api/partner/cars/:id', authenticateToken, async (req, res) => {
  try {
    const car = await Car.findOne({ _id: req.params.id, partner: req.user.userId });
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // Prevent partner from activating an admin-deactivated car
    if (req.body.available === true && car.adminDeactivated) {
      return res.status(403).json({ 
        message: 'This car has been deactivated by admin. Please contact support to reactivate.' 
      });
    }

    // Partners cannot modify adminDeactivated field
    const updateData = { ...req.body };
    delete updateData.adminDeactivated;

    const updatedCar = await Car.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updatedCar);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/partner/cars/:id', authenticateToken, async (req, res) => {
  try {
    const car = await Car.findOne({ _id: req.params.id, partner: req.user.userId });
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    await Car.findByIdAndDelete(req.params.id);
    res.json({ message: 'Car deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Partner bookings
app.get('/api/partner/bookings', authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate({
        path: 'car',
        match: { partner: req.user.userId }
      })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    const partnerBookings = bookings.filter(booking => booking.car !== null);
    res.json({ bookings: partnerBookings });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Partner earning
app.get('/api/partner/earnings', authenticateToken, async (req, res) => {
  try {
    // Step 1: Get all car IDs belonging to this partner
    const partnerCars = await Car.find({ 
      partner: req.user.userId,
      isPartnerCar: true 
    }, '_id');
    
    const carIds = partnerCars.map(car => car._id);

    // Step 2: Sum earnings from completed bookings for those cars
    const result = await Booking.aggregate([
      {
        $match: {
          car: { $in: carIds },
          status: 'completed' // Only count finished rentals
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { 
            $sum: { $multiply: ['$totalAmount', 0.9] } // 90% after commission
          }
        }
      }
    ]);

    const earnings = result.length > 0 ? result[0].totalEarnings : 0;

    res.json({ earnings });
  } catch (error) {
    console.error('Earnings calculation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin partner management routes
app.get('/api/admin/partners', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    const partners = await Partner.find(query)
      .populate('user', 'name email phone createdAt')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(partners);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin Partner Earnings Routes
app.get('/api/admin/partner-earnings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const partners = await Partner.find({ status: 'approved' })
      .populate('user', 'name email')
      .populate('approvedBy', 'name');

    const partnerEarnings = await Promise.all(
      partners.map(async (partner) => {
        // Get all cars belonging to this partner
        const partnerCars = await Car.find({ 
          partner: partner.user._id,
          isPartnerCar: true 
        }, '_id');
        
        const carIds = partnerCars.map(car => car._id);

        // Calculate earnings from completed bookings
        const bookings = await Booking.aggregate([
          {
            $match: {
              car: { $in: carIds },
              status: 'completed'
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$totalAmount' },
              totalBookings: { $sum: 1 }
            }
          }
        ]);

        const totalRevenue = bookings.length > 0 ? bookings[0].totalRevenue : 0;
        const totalBookings = bookings.length > 0 ? bookings[0].totalBookings : 0;
        const platformEarnings = totalRevenue * (partner.commissionRate / 100);
        const partnerEarnings = totalRevenue - platformEarnings;

        return {
          _id: partner._id,
          user: partner.user,
          totalBookings,
          partnerEarnings,
          platformEarnings,
          commissionRate: partner.commissionRate,
          totalRevenue
        };
      })
    );

    res.json(partnerEarnings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/admin/partner-earnings/:partnerId/details', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.partnerId).populate('user');
    
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    // Get all cars belonging to this partner
    const partnerCars = await Car.find({ 
      partner: partner.user._id,
      isPartnerCar: true 
    }, '_id name brand model');
    
    const carIds = partnerCars.map(car => car._id);

    // Get all completed bookings for these cars
    const bookings = await Booking.find({
      car: { $in: carIds },
      status: 'completed'
    })
    .populate('car', 'name brand model')
    .sort({ createdAt: -1 });

    const earningsDetails = bookings.map(booking => {
      const platformShare = booking.totalAmount * (partner.commissionRate / 100);
      const partnerShare = booking.totalAmount - platformShare;

      return {
        bookingId: booking._id.toString().slice(-8),
        carName: `${booking.car.brand} ${booking.car.model}`,
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalAmount: booking.totalAmount,
        platformShare: platformShare.toFixed(2),
        partnerShare: partnerShare.toFixed(2)
      };
    });

    res.json(earningsDetails);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


app.get('/api/admin/partner-cars', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const cars = await Car.find({ isPartnerCar: true })
      .populate('partner', 'name email _id') // Explicitly include _id
      .sort({ createdAt: -1 });

    res.json(cars); // Returns array directly
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/admin/partner-cars/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // Check if there are any active bookings for this car
    const activeBookings = await Booking.findOne({
      car: req.params.id,
      status: { $in: ['pending', 'confirmed', 'active'] }
    });

    if (activeBookings) {
      return res.status(400).json({ 
        message: 'Cannot delete car with active bookings' 
      });
    }

    await Car.findByIdAndDelete(req.params.id);
    res.json({ message: 'Partner car deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/admin/partner-cars/:id/availability', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { available, adminDeactivated } = req.body;
    
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // If admin is deactivating, set adminDeactivated flag
    const updateData = { 
      available: available !== undefined ? available : car.available 
    };
    
    if (adminDeactivated !== undefined) {
      updateData.adminDeactivated = adminDeactivated;
      // If admin is deactivating, also set available to false
      if (adminDeactivated === true) {
        updateData.available = false;
      }
    }

    const updatedCar = await Car.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('partner', 'name email');

    if (!updatedCar) {
      return res.status(404).json({ message: 'Car not found' });
    }

    const action = adminDeactivated ? 'admin deactivated' : (available ? 'activated' : 'deactivated');
    res.json({
      message: `Car ${action} successfully`,
      car: updatedCar
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


app.put('/api/admin/partners/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const partner = await Partner.findById(req.params.id).populate('user');

    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    partner.status = status;
    partner.approvedAt = status === 'approved' ? new Date() : null;
    partner.approvedBy = status === 'approved' ? req.user.userId : null;

    // Update user's partner status based on approval status
    const updatedUser = await User.findByIdAndUpdate(
      partner.user._id, 
      {
        isPartner: status === 'approved',
        partnerSince: status === 'approved' ? new Date() : null
      },
      { new: true }
    );

    await partner.save();

    res.json({
      message: `Partner application ${status} successfully`,
      partner,
      userId: partner.user._id
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/admin/partner-cars/:id/reactivate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const car = await Car.findByIdAndUpdate(
      req.params.id,
      { 
        adminDeactivated: false,
        available: true 
      },
      { new: true }
    ).populate('partner', 'name email');

    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    res.json({
      message: 'Car reactivated successfully',
      car
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/admin/partners/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    // Remove partner status from user
    await User.findByIdAndUpdate(partner.user, {
      isPartner: false,
      partnerSince: null
    });

    // Delete partner cars
    await Car.deleteMany({ partner: partner.user });

    await Partner.findByIdAndDelete(req.params.id);

    res.json({ message: 'Partner removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Serve partner files statically
app.use('/user', express.static(path.join(__dirname, 'user')));


// Update initialCars array in server.js
const initialCars = [
  {
    name: 'Tesla Model 3', brand: 'Tesla', model: 'Long Range', year: 2022, price: 90,
    image: 'https://images.unsplash.com/photo-1549921296-3b4a6b7c2c2b?q=80&w=1200&auto=format&fit=crop',
    available: true, description: 'Premium electric sedan with autopilot and long range.',
    seats: 5, transmission: 'automatic', fuelType: 'electric',
    carType: 'luxury', // ADD THIS
    features: ['Autopilot', 'Premium Sound', 'Panoramic Roof', 'Fast Charging'],
    mileage: '150 miles per charge', color: 'Midnight Silver'
  },
  {
    name: 'Honda Civic', brand: 'Honda', model: 'EX', year: 2021, price: 65,
    image: 'https://images.unsplash.com/photo-1549921296-3b4a6b7c2c2b?q=80&w=1200&auto=format&fit=crop',
    available: true, description: 'Reliable compact with great mileage and comfort.',
    seats: 5, transmission: 'automatic', fuelType: 'petrol',
    carType: 'economy', // ADD THIS
    features: ['Apple CarPlay', 'Android Auto', 'Backup Camera', 'Cruise Control'],
    mileage: '35 MPG', color: 'Crystal Black'
  },
  {
    name: 'Toyota Corolla', brand: 'Toyota', model: 'LE', year: 2020, price: 60,
    image: 'https://images.unsplash.com/photo-1549921296-3b4a6b7c2c2b?q=80&w=1200&auto=format&fit=crop',
    available: true, description: 'Economical sedan perfect for city driving.',
    seats: 5, transmission: 'manual', fuelType: 'petrol',
    carType: 'economy', // ADD THIS
    features: ['Bluetooth', 'Air Conditioning', 'Power Windows', 'AM/FM Radio'],
    mileage: '32 MPG', color: 'Classic Silver'
  },
  {
    name: 'Ford Mustang', brand: 'Ford', model: 'GT', year: 2019, price: 140,
    image: 'https://images.unsplash.com/photo-1549921296-3b4a6b7c2c2b?q=80&w=1200&auto=format&fit=crop',
    available: true, description: 'Classic American muscle car with a powerful engine.',
    seats: 4, transmission: 'manual', fuelType: 'petrol',
    carType: 'sports', // ADD THIS
    features: ['V8 Engine', 'Sports Suspension', 'Leather Seats', 'Premium Audio'],
    mileage: '20 MPG', color: 'Race Red'
  },
  {
    name: 'Toyota RAV4', brand: 'Toyota', model: 'Adventure', year: 2021, price: 85,
    image: 'https://images.unsplash.com/photo-1549921296-3b4a6b7c2c2b?q=80&w=1200&auto=format&fit=crop',
    available: true, description: 'Versatile SUV perfect for family trips and adventures.',
    seats: 5, transmission: 'automatic', fuelType: 'hybrid',
    carType: 'suv', // ADD THIS
    features: ['AWD', 'Apple CarPlay', 'Sunroof', 'Lane Assist'],
    mileage: '40 MPG', color: 'Magnetic Gray'
  },
  {
    name: 'BMW 3 Series', brand: 'BMW', model: '330i', year: 2022, price: 120,
    image: 'https://images.unsplash.com/photo-1549921296-3b4a6b7c2c2b?q=80&w=1200&auto=format&fit=crop',
    available: true, description: 'Luxury sports sedan with premium features and performance.',
    seats: 5, transmission: 'automatic', fuelType: 'petrol',
    carType: 'luxury', // ADD THIS
    features: ['Leather Interior', 'Navigation', 'Heated Seats', 'Premium Package'],
    mileage: '28 MPG', color: 'Alpine White'
  }
];


// Create default admin user
const createDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ isAdmin: true });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = new User({
        name: 'Admin',
        email: 'admin@carrental.com',
        password: hashedPassword,
        phone: '1234567890',
        isAdmin: true
      });
      await admin.save();
      console.log('Default admin created: admin@carrental.com / admin123');
    }
  } catch (error) {
    console.error('Error creating default admin:', error.message);
  }
};

// OTP 
const otpStore = new Map();

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}



// Seed initial car data
const seedCars = async () => {
  try {
    const carCount = await Car.countDocuments();
    if (carCount === 0) {
      await Car.insertMany(initialCars);
      console.log('Initial cars seeded successfully.');
    }
  } catch (error) {
    console.error('Error seeding cars:', error.message);
  }
};

mongoose.connection.once('open', async () => {
  console.log('MongoDB connected successfully');
  await createDefaultAdmin();
  await seedCars();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});