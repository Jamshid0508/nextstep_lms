import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { ensureSuperAdmin } from './seeds/superadmin.seed.js';

let isInitialized = false;

async function init() {
  if (isInitialized) return;
  try {
    console.log('[server] Initializing... MONGO_URI set:', !!process.env.MONGO_URI);
    await connectDb();
    await ensureSuperAdmin();
    isInitialized = true;
    console.log('[server] Initialization complete');
  } catch (err) {
    console.error('[server] Init failed:', err.message, err.stack);
    throw err; // Re-throw so middleware returns 503
  }
}

// Pass init to createApp so it runs as the FIRST middleware (before routes)
const app = createApp(init);

// Local development: start HTTP server
if (!process.env.VERCEL) {
  init().then(() => {
    app.listen(env.port, () => {
      console.log(`[server] Next Step API http://localhost:${env.port}/api/v1 (${env.nodeEnv})`);
    });
  });
}

// Vercel serverless: export Express app
export default app;

