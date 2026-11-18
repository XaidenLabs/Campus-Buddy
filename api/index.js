// Vercel serverless entry: every /api/* request is routed here (see vercel.json)
// and handled by the same Express app used locally.
import { app, ready } from '../server/src/app.js';

export default async function handler(req, res) {
  try {
    await ready();
  } catch (err) {
    console.error('Startup failed:', err.message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Server could not connect to the database' }));
    return;
  }
  return app(req, res);
}
