import dns from 'node:dns';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './config.js';
import { HttpError } from './utils/asyncHandler.js';
import { aiMode } from './services/ai.js';
import { runSeed } from './seed/runSeed.js';
import { ensureAdmin } from './seed/ensureAdmin.js';
import adminRoutes from './routes/admin.js';

// Not needed (and not wanted) on Vercel
if (config.dnsServers.length && !process.env.VERCEL) dns.setServers(config.dnsServers);

import authRoutes from './routes/auth.js';
import buildingRoutes from './routes/buildings.js';
import dashboardRoutes from './routes/dashboard.js';
import announcementRoutes from './routes/announcements.js';
import eventRoutes from './routes/events.js';
import courseRoutes from './routes/courses.js';
import taskRoutes from './routes/tasks.js';
import chatRoutes from './routes/chat.js';

export const app = express();

// Vercel (and most hosts) sit behind a proxy; this makes req.ip the real visitor IP for rate limiting
app.set('trust proxy', 1);

app.use(cors({ origin: config.clientOrigins }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ai: aiMode(), db: mongoose.connection.readyState === 1 });
});

app.use('/api/auth', authRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Not found')));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  let status = err.status || 500;
  let message = err.message;

  if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join('. ');
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = 'Invalid value';
  } else if (err.code === 11000) {
    status = 409;
    message = 'That record already exists';
  } else if (err instanceof SyntaxError && 'body' in err) {
    status = 400;
    message = 'Invalid JSON';
  }

  if (status >= 500) {
    console.error(err);
    if (config.isProd) message = 'Something went wrong';
  }
  res.status(status).json({ error: message });
});

/**
 * Connects to MongoDB once and runs first-start setup (sample data, admin account).
 * Safe to call on every request: later calls reuse the same promise (important for serverless).
 */
let readyPromise;
export function ready() {
  if (!readyPromise) {
    readyPromise = (async () => {
      await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 });
      console.log('MongoDB connected');

      if (config.autoSeed && (await runSeed())) {
        console.log('Database was empty - sample campus data added.');
        if (config.demoUser.email) console.log(`Demo login: ${config.demoUser.email} (password from DEMO_USER_PASSWORD)`);
      }

      const admin = await ensureAdmin();
      if (admin) {
        console.log(
          admin.created
            ? `Admin account created: ${admin.email} (password from ADMIN_PASSWORD)`
            : `${admin.email} is now an admin (existing password kept)`
        );
      }
    })().catch((err) => {
      readyPromise = undefined; // let the next request try again
      throw err;
    });
  }
  return readyPromise;
}
