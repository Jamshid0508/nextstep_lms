import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { ensureSuperAdmin } from './seeds/superadmin.seed.js';

async function start() {
  await connectDb();
  await ensureSuperAdmin();

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`[server] Next Step API http://localhost:${env.port}/api/v1 (${env.nodeEnv})`);
  });
}

start().catch((err) => {
  console.error('[server] Ishga tushirishda xatolik:', err);
  process.exit(1);
});
