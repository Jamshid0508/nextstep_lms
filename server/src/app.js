import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import superadminRoutes from './routes/superadmin/index.js';
import teacherRoutes from './routes/teacher/index.js';
import studentRoutes from './routes/student/index.js';
import parentRoutes from './routes/parent/index.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';

export function createApp(initFn) {
  const app = express();

  // DB init middleware must be FIRST so MongoDB connects before routes run
  if (initFn) {
    app.use(async (_req, _res, next) => {
      try {
        await initFn();
      } catch (e) {
        console.error('[app] init error:', e.message);
      }
      next();
    });
  }

  app.use(helmet());
  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

  const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 200 });
  const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 });

  app.use('/api/v1', apiLimiter);
  app.use('/api/v1/auth/login', loginLimiter);

  app.get('/api/v1/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/superadmin', superadminRoutes);
  app.use('/api/v1/teacher', teacherRoutes);
  app.use('/api/v1/student', studentRoutes);
  app.use('/api/v1/parent', parentRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

