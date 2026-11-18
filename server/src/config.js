import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Always load server/.env (locally). On Vercel there is no .env file; values come from the project settings, no matter which folder the server is started from
const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.env');
dotenv.config({ path: envPath });

const env = (name, fallback = '') => (process.env[name] ?? fallback).toString().trim();
const list = (value) => value.split(',').map((s) => s.trim()).filter(Boolean);

// Sensitive values have NO defaults in the code. They must come from server/.env.
const REQUIRED = ['MONGODB_URI', 'JWT_SECRET'];
const missing = REQUIRED.filter((name) => !env(name));
if (missing.length) {
  throw new Error(
    `Missing required setting(s): ${missing.join(', ')}. ` +
      `Locally: put them in server/.env. On Vercel: Project Settings > Environment Variables.`
  );
}

const isProd = env('NODE_ENV') === 'production';
const clientOrigins = list(env('CLIENT_ORIGIN', 'http://localhost:5173'));

export const config = {
  isProd,
  port: Number(env('PORT')) || 5000,

  // Secrets - only ever read from the environment
  mongoUri: env('MONGODB_URI'),
  jwtSecret: env('JWT_SECRET'),
  openaiKey: env('OPENAI_API_KEY'),
  smtp: {
    host: env('SMTP_HOST'),
    port: Number(env('SMTP_PORT')) || 587,
    user: env('SMTP_USER'),
    pass: env('SMTP_PASS'),
    from: env('MAIL_FROM'),
  },
  adminEmail: env('ADMIN_EMAIL').toLowerCase(),
  adminPassword: env('ADMIN_PASSWORD'),
  demoUser: {
    email: env('DEMO_USER_EMAIL').toLowerCase(),
    password: env('DEMO_USER_PASSWORD'),
  },

  // Non-secret settings
  clientOrigins,
  clientUrl: (env('CLIENT_URL') || clientOrigins[0] || 'http://localhost:5173').replace(/\/$/, ''),
  openaiModel: env('OPENAI_MODEL', 'gpt-4o-mini'),
  autoSeed: env('AUTO_SEED', 'true') === 'true',
  timeZone: 'Africa/Lagos',
  // Fixes "querySrv ECONNREFUSED" with MongoDB Atlas on some networks. Set DNS_SERVERS= (empty) to turn off.
  dnsServers: list(process.env.DNS_SERVERS ?? '8.8.8.8,1.1.1.1'),
};
