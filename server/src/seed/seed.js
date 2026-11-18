// Usage: npm run seed   (wipes buildings, courses, events, announcements, tasks and chat, then re-seeds)
import dns from 'node:dns';
import mongoose from 'mongoose';
import { config } from '../config.js';
import { runSeed } from './runSeed.js';
import { demoUser } from './data.js';

try {
  if (config.dnsServers.length) dns.setServers(config.dnsServers);
  await mongoose.connect(config.mongoUri);
  await runSeed({ reset: true });
  console.log('Seeded sample campus data.');
  if (demoUser.email) console.log(`Demo login: ${demoUser.email} (password from DEMO_USER_PASSWORD in .env)`);
} catch (err) {
  console.error('Seeding failed:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
