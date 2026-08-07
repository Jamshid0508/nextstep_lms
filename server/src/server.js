import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { ensureSuperAdmin } from './seeds/superadmin.seed.js';

let isInitialized = false;

async function init() {
  if (isInitialized) return;
  try {
    await connectDb();
    await ensureSuperAdmin();
    isInitialized = true;
  } catch (err) {
    console.error('[server] MongoDB ulanib bo\'lmadi. Atlas IP whitelist yoki Mongo serveri tekshirilishi kerak.');
    console.error('[server] Xato tafsiloti:', err.message || err);
  }
}

const app = createApp();

app.use(async (_req, _res, next) => {
  await init();
  next();
});

if (!process.env.VERCEL) {
  init().then(() => {
    app.listen(env.port, () => {
      console.log(`[server] Next Step API http://localhost:${env.port}/api/v1 (${env.nodeEnv})`);
    });
  });
}

export default app;
