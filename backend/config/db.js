// ============================================================
// config/db.js — MongoDB Atlas connection with readiness check
// ============================================================

const dns = require('dns');
// Use reliable Google/Cloudflare public DNS for Atlas SRV resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {
  // Ignore DNS set errors if environment does not allow
}

const mongoose = require('mongoose');

// Configure global connection event listeners
mongoose.connection.on('connecting', () => {
  console.log('🔄 Connecting to MongoDB Atlas...');
});

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB Connection Established');
});

mongoose.connection.on('open', () => {
  console.log(`✅ MongoDB Connection Open (Database: ${mongoose.connection.name})`);
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ MongoDB Connection Error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB Disconnected. Attempting automatic reconnection...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB Reconnected successfully');
});

const connectDB = async () => {
  const MONGO_URI = process.env.MONGO_URI;

  if (!MONGO_URI || MONGO_URI.includes('<username>')) {
    const errorMsg = 'MONGO_URI is not configured or contains placeholders. Check backend/.env';
    console.error(`❌ Fatal Database Configuration Error: ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const options = {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    maxPoolSize: 25,
    minPoolSize: 2,
    heartbeatFrequencyMS: 10000,
  };

  try {
    const conn = await mongoose.connect(MONGO_URI, options);
    // Actively verify database readiness with a ping
    await conn.connection.db.admin().ping();
    console.log(`✅ MongoDB Atlas Ready and Verified (Host: ${conn.connection.host})`);
    return conn;
  } catch (error) {
    console.error(`❌ Failed to connect to MongoDB Atlas: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
