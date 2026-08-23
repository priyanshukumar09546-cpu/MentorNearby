// ============================================================
// models/PrintProvider.js
// Extensible provider architecture for notes/formula sheet printing
// (Blinkit, Zepto, Local Print Shop partners)
// ============================================================

const mongoose = require('mongoose');

const printProviderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Provider name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Provider code is required'],
      unique: true,
      uppercase: true,
      trim: true, // e.g. 'BLINKIT', 'ZEPTO', 'LOCAL_PARTNER'
    },
    tagline: {
      type: String,
      trim: true, // e.g. '⚡ Delivered in 10-15 mins'
    },
    description: {
      type: String,
      trim: true,
    },
    logoUrl: {
      type: String,
      trim: true,
    },
    externalUrl: {
      type: String,
      trim: true, // official service / deep link
    },
    supportedLocations: [
      {
        type: String,
        trim: true, // City or PIN codes, empty means All India / Major Metros
      },
    ],
    type: {
      type: String,
      enum: ['EXTERNAL_QUICK_COMMERCE', 'LOCAL_SHOP_PARTNER', 'ON_DEMAND_COURIER'],
      default: 'EXTERNAL_QUICK_COMMERCE',
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    priority: {
      type: Number,
      default: 1,
    },
    badge: {
      type: String,
      default: 'Convenience Partner',
    },
  },
  {
    timestamps: true,
  }
);

const PrintProvider = mongoose.model('PrintProvider', printProviderSchema);

module.exports = PrintProvider;
