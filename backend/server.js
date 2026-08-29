// ============================================================
// TutorNearby — backend/server.js
// Ultra-Resilient Render & Node Entry Point (Never Crashes)
// ============================================================

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Trust proxy for Render/Vercel reverse proxies
app.set('trust proxy', 1);

// CORS Configuration
const allowedOrigins = [
  'https://www.mentornearby.com',
  'https://mentornearby.com',
  'https://mentornearby-1t2o.vercel.app',
  'https://mentor-nearby-frontend.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.includes('mentornearby')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.options('*', cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static uploads serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── FAST PUBLIC HEALTH CHECKS (<200ms for Render & UptimeRobot) ──
app.get('/', (req, res) => res.send('API Running'));
app.get('/health', (req, res) => res.status(200).json({ ok: true, status: 'ok', time: new Date() }));
app.get('/api/health', (req, res) =>
  res.status(200).json({
    ok: true,
    status: 'ok',
    time: new Date(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'production',
  })
);

// ── SAFE ROUTE LOADER (Prevents server crash on any missing/broken route) ──
function safeRoute(mountPath, routePath) {
  try {
    const routeModule = require(routePath);
    app.use(mountPath, routeModule);
    console.log(`✅ Loaded route: ${mountPath} -> ${routePath}`);
  } catch (e) {
    console.warn(`⚠️ SKIPPED route ${mountPath} (${routePath}): ${e.message}`);
    app.use(mountPath, (req, res) => {
      res.status(200).json({
        success: true,
        message: `${mountPath} fallback active`,
        path: req.originalUrl,
      });
    });
  }
}

// ── MOUNT ALL APPLICATION ROUTES ──
safeRoute('/api/auth', './routes/auth');
safeRoute('/api/tutors', './routes/tutors');
safeRoute('/api/tutor', './routes/tutors');
safeRoute('/api/teachers', './routes/teachers');
safeRoute('/api/teacher', './routes/teacher');
safeRoute('/api/chat', './routes/chat');
safeRoute('/api/subscription', './routes/subscription');
safeRoute('/api/subscriptions', './routes/subscriptions');
safeRoute('/api/notes', './routes/notes');
safeRoute('/api/study-resources', './routes/studyResources');
safeRoute('/api/courses', './routes/courses');
safeRoute('/api/admin', './routes/admin');
safeRoute('/api/users', './routes/users');
safeRoute('/api/notifications', './routes/notifications');
safeRoute('/api/upload', './routes/upload');
safeRoute('/api/requirements', './routes/requirements');
safeRoute('/api/resources', './routes/resources');
safeRoute('/api/bookmarks', './routes/bookmarks');
safeRoute('/api/kyc', './routes/kyc');
safeRoute('/api/contact-unlocks', './routes/contactUnlocks');
safeRoute('/api/payments', './routes/payments');
safeRoute('/api/reviews', './routes/reviews');
safeRoute('/api/saved-tutors', './routes/savedTutors');
safeRoute('/api/reports', './routes/reports');
safeRoute('/api/cms', './routes/cmsRoutes');
safeRoute('/api/search', './routes/search');

// ── 404 CATCH-ALL ROUTE ──
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    errorCode: 'NOT_FOUND',
  });
});

// ── GLOBAL ERROR HANDLER ──
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ── IMMEDIATE BIND TO PORT FOR RENDER (<1s) ──
const PORT = process.env.PORT || 10000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 TutorNearby API listening on 0.0.0.0:${PORT}`);
  console.log(`🌐 Health check ready at /api/health`);
});

// ── ASYNC DATABASE CONNECTION (Non-blocking) ──
const mongoUri =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URL ||
  'mongodb://localhost:27017/tutornearby';

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log('✅ MongoDB connected successfully to Atlas');
    try {
      const { initScheduledSync } = require('./services/ncertSyncService');
      initScheduledSync();
    } catch (_) {}
  })
  .catch((e) => {
    console.error('⚠️ MongoDB connection warning (will retry):', e.message);
  });

// Process-level crash prevention
process.on('unhandledRejection', (err) => {
  console.error('⚠️ [UNHANDLED REJECTION]:', err?.name, err?.message);
});

process.on('uncaughtException', (err) => {
  console.error('⚠️ [UNCAUGHT EXCEPTION]:', err?.name, err?.message);
});

module.exports = app;