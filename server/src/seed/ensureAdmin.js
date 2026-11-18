import { config } from '../config.js';
import { User } from '../models/User.js';

/**
 * Makes sure at least one admin exists. Runs on every start but does nothing once an admin exists.
 * Credentials come only from ADMIN_EMAIL / ADMIN_PASSWORD in server/.env - there is no default password.
 * Returns { email, created } when an account was created or promoted, otherwise null.
 */
export async function ensureAdmin() {
  if (await User.exists({ role: 'admin' })) return null;

  if (!config.adminEmail || !config.adminPassword) {
    console.warn('No admin account exists. Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env to create one.');
    return null;
  }

  const existing = await User.findOne({ email: config.adminEmail });
  if (existing) {
    existing.role = 'admin';
    await existing.save();
    return { email: config.adminEmail, created: false };
  }

  await User.create({ name: 'Campus Admin', email: config.adminEmail, password: config.adminPassword, role: 'admin' });
  return { email: config.adminEmail, created: true };
}
