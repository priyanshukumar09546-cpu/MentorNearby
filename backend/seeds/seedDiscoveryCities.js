// ============================================================
// seeds/seedDiscoveryCities.js
// Seeds the 21 Initial Indian Discovery Cities into MongoDB
// Priority for Hapur, Ghaziabad, Delhi, Meerut
// Default Target: 50 Leads per City
// ============================================================

const mongoose = require('mongoose');
const DiscoveryCity = require('../models/DiscoveryCity');

const INITIAL_CITIES = [
  // Priority 1
  { name: 'Hapur', state: 'Uttar Pradesh', isPriority: true },
  { name: 'Ghaziabad', state: 'Uttar Pradesh', isPriority: true },
  { name: 'Delhi', state: 'Delhi NCR', isPriority: true },
  { name: 'Meerut', state: 'Uttar Pradesh', isPriority: true },
  
  // NCR & North
  { name: 'Noida', state: 'Uttar Pradesh', isPriority: false },
  { name: 'Gurgaon', state: 'Haryana', isPriority: false },
  { name: 'Faridabad', state: 'Haryana', isPriority: false },
  { name: 'Chandigarh', state: 'Punjab / Haryana', isPriority: false },
  { name: 'Agra', state: 'Uttar Pradesh', isPriority: false },
  { name: 'Kanpur', state: 'Uttar Pradesh', isPriority: false },
  { name: 'Lucknow', state: 'Uttar Pradesh', isPriority: false },
  { name: 'Varanasi', state: 'Uttar Pradesh', isPriority: false },
  { name: 'Prayagraj', state: 'Uttar Pradesh', isPriority: false },
  { name: 'Jaipur', state: 'Rajasthan', isPriority: false },

  // Tier 1 Metros & South/West/East
  { name: 'Mumbai', state: 'Maharashtra', isPriority: false },
  { name: 'Pune', state: 'Maharashtra', isPriority: false },
  { name: 'Ahmedabad', state: 'Gujarat', isPriority: false },
  { name: 'Bengaluru', state: 'Karnataka', isPriority: false },
  { name: 'Hyderabad', state: 'Telangana', isPriority: false },
  { name: 'Chennai', state: 'Tamil Nadu', isPriority: false },
  { name: 'Kolkata', state: 'West Bengal', isPriority: false },
];

async function seedDiscoveryCities() {
  console.log('🌱 Seeding initial 21 discovery cities...');
  let added = 0;
  let existing = 0;

  for (const c of INITIAL_CITIES) {
    const found = await DiscoveryCity.findOne({ name: new RegExp(`^${c.name}$`, 'i') });
    if (!found) {
      await DiscoveryCity.create({
        name: c.name,
        state: c.state,
        targetLeadCount: 50,
        isPriority: c.isPriority,
        isEnabled: true,
        status: 'IDLE',
      });
      added++;
    } else {
      existing++;
    }
  }

  console.log(`✅ Discovery cities seeded: ${added} added, ${existing} already existed. Total: ${INITIAL_CITIES.length}`);
}

module.exports = seedDiscoveryCities;

if (require.main === module) {
  const dns = require('dns');
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (_) {}
  const path = require('path');
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
  mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {
      await seedDiscoveryCities();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
