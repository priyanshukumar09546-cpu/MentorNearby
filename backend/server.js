// ============================================================
// TutorNearby — server.js
// Main Express application entry point
// ============================================================
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Import Routes
const authRoutes = require('./routes/auth');
const tutorRoutes = require('./routes/tutors');
const searchRoutes = require('./routes/search');
const kycRoutes = require('./routes/kyc');
const contactUnlockRoutes = require('./routes/contactUnlocks');
const paymentRoutes = require('./routes/payments');
const reviewRoutes = require('./routes/reviews');
const savedTutorRoutes = require('./routes/savedTutors');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const uploadRoutes = require('./routes/upload');
const requirementsRoutes = require('./routes/requirements');
const chatRoutes = require('./routes/chat');
const resourceRoutes = require('./routes/resources');
const bookmarkRoutes = require('./routes/bookmarks');
const studyResourceRoutes = require('./routes/studyResources');
const courseRoutes = require('./routes/courses');
const cmsRoutes = require('./routes/cmsRoutes');
const { initScheduledSync } = require('./services/ncertSyncService');

const app = express();

// Trust proxy for reverse proxy platforms like Render/Vercel (fixes ERR_UNEXPECTED_X_FORWARDED_FOR)
app.set('trust proxy', 1);

// Force HTTPS redirect in production
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});

// ============================================================
// CORS CONFIGURATION (Explicit Allowed Origins for Credentials)
// ============================================================
const allowedOrigins = [
  "https://mentornearby.netlify.app",
  "https://mentornearby.com",
  "https://www.mentornearby.com",
  "https://admin.mentornearby.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "https://mentor-nearby-frontend.vercel.app",
  "https://mentor-nearby.vercel.app",
  "https://mentornearby.vercel.app",
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.netlify.app') ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com') ||
      origin.includes('mentornearby') ||
      origin.includes('localhost')
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================

// Security HTTP headers
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  frameguard: false, // Allow in-browser PDF reader rendering
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://checkout.razorpay.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com', 'https://*.cloudinary.com', 'https://mentornearby.com', 'https://ncert.nic.in', 'https://*.ncert.nic.in'],
      mediaSrc: ["'self'", 'https://res.cloudinary.com', 'https://*.cloudinary.com'],
      frameSrc: ["'self'", 'http://localhost:5173', 'http://localhost:5174', process.env.FRONTEND_URL || 'http://localhost:5173', 'https://mentornearby.com', 'https://api.razorpay.com', 'https://checkout.razorpay.com', 'https://*.cloudinary.com', 'https://ncert.nic.in', 'https://*.ncert.nic.in', 'blob:', 'data:'],
      connectSrc: ["'self'", 'http://localhost:5173', 'http://localhost:5174', 'https://mentor-nearby-frontend.vercel.app', 'https://*.vercel.app', process.env.FRONTEND_URL || 'http://localhost:5173', 'https://mentornearby.com', 'https://www.mentornearby.com', 'https://admin.mentornearby.com', 'https://api.razorpay.com', 'https://checkout.razorpay.com', 'https://*.cloudinary.com', 'https://ncert.nic.in', 'https://*.ncert.nic.in'],
    },
  },
}));

// Ensure Database connection for every incoming request (Serverless & Container support)
app.use(async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    next();
  } catch (dbErr) {
    console.error('Database connection middleware error:', dbErr.message);
    next(dbErr);
  }
});


// Request body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing
app.use(cookieParser());

// MongoDB injection protection (sanitize inputs)
app.use(mongoSanitize());

// ============================================================
// LOGGING (dev only)
// ============================================================
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ============================================================
// RATE LIMITING
// ============================================================

// Global rate limit
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1500, // 1500 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
  },
});

// Strict limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 100, // Reasonable limit preventing brute force without blocking testing
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
    errorCode: 'AUTH_RATE_LIMITED',
  },
});

app.use('/api', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/send-otp', authLimiter);
app.use('/api/auth/verify-otp', authLimiter);
app.use('/api/auth/aadhaar/send-otp', authLimiter);
app.use('/api/auth/aadhaar/verify-otp', authLimiter);

// ============================================================
// HEALTH CHECK
// ============================================================
const healthCheckHandler = (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(isDbConnected ? 200 : 503).json({
    success: isDbConnected,
    message: isDbConnected ? 'MentorNearby API is healthy' : 'Database connection unavailable',
    dbState: isDbConnected ? 'CONNECTED' : 'DISCONNECTED',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
};

app.get('/health', healthCheckHandler);
app.get('/api/health', healthCheckHandler);

// ============================================================
// API ROUTES
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/tutor', tutorRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/contact-unlocks', contactUnlockRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/saved-tutors', savedTutorRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/requirements', requirementsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/study-resources', studyResourceRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/cms', cmsRoutes);

// Static uploads serving (for local master study combo files & documents)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================
// 404 HANDLER
// ============================================================
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    errorCode: 'NOT_FOUND',
  });
});

// ============================================================
// CENTRALIZED ERROR HANDLER (must be last)
// ============================================================
app.use(errorHandler);

// ============================================================
// START SERVER (Waiting for MongoDB readiness before listening)
// ============================================================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log('🚀 Starting TutorNearby Backend...');
    
    // 1. Await database connection before accepting any HTTP requests
    await connectDB();

    // 2. Automated Admin Seeder (when SEED_ADMIN === 'true')
    if (process.env.SEED_ADMIN === 'true') {
      try {
        const seedAdmin = require('./seedAdmin');
        await seedAdmin();
      } catch (seedErr) {
        console.error('⚠️ [SEED_ADMIN WARNING]:', seedErr.message);
      }
    }

    // 3. Initialize background schedulers
    try {
      initScheduledSync();
    } catch (schedErr) {
      console.warn('⚠️ NCERT background scheduler init warning:', schedErr.message);
    }

    // 3. Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`🚀 TutorNearby API running on port ${PORT} [${process.env.NODE_ENV}]`);
      console.log('🌐 Server is ready to accept incoming requests');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('UNHANDLED REJECTION! Shutting down...');
      console.error(err?.name, err?.message);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle SIGTERM (for Render / Docker graceful shutdown)
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('Process terminated.');
      });
    });

    return server;
  } catch (fatalErr) {
    console.error('💥 FATAL ERROR: Server startup aborted due to database connection failure:');
    console.error(fatalErr.message);
    process.exit(1);
  }
};

// Start HTTP server only if executed directly (e.g. node server.js), not in serverless runtime
if (require.main === module && !process.env.VERCEL) {
  startServer();
} else {
  connectDB().catch((err) => console.error('Serverless DB connect error:', err.message));
}

module.exports = app;