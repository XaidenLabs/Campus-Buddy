// Local server: `npm run dev` (or `npm run server`). On Vercel, api/index.js is used instead.
import { app, ready } from './app.js';
import { config } from './config.js';
import { aiMode } from './services/ai.js';

try {
  await ready();
  app.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}  (AI mode: ${aiMode()})`);
  });
} catch (err) {
  console.error('Failed to start server:', err.message);
  process.exit(1);
}
