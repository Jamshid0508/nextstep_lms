import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { ensureSuperAdmin } from './seeds/superadmin.seed.js';

async function start() {
  try {
    await connectDb();
    await ensureSuperAdmin();
  } catch (err) {
    console.error('[server] MongoDB ulanib bo\'lmadi. Atlas IP whitelist yoki Mongo serveri tekshirilishi kerak.');
    console.error('[server] Xato tafsiloti:', err.message || err);
    console.warn('[server] Server DBsiz ham ishga tushadi, lekin ma\'lumotlar bazasi bo\'lmagan API so\'rovlar ishlamaydi.');
  }

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`[server] Next Step API http://localhost:${env.port}/api/v1 (${env.nodeEnv})`);
  });
}

start().catch((err) => {
  console.error('[server] Ishga tushirishda xatolik:', err);
  console.warn('[server] Serverdan chiqish o\'rniga xatolik ko\'rsatilmoqda.');
});
