import 'dotenv/config';

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 5000),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  mongoUri: required('MONGO_URI', 'mongodb://127.0.0.1:27017/next-step'),

  jwtSecret: required('JWT_SECRET'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
  tokenExpiresIn: process.env.TOKEN_EXPIRES_IN ?? '15m',
  refreshExpiresIn: process.env.REFRESH_EXPIRES_IN ?? '7d',

  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 10),

  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim()),

  adminSeed: {
    name: process.env.ADMIN_SEED_NAME ?? 'Super Admin',
    email: process.env.ADMIN_SEED_EMAIL ?? 'superadmin@nextstep.uz',
    phone: process.env.ADMIN_SEED_PHONE ?? '+998900000000',
    password: process.env.ADMIN_SEED_PASSWORD ?? 'ChangeMe123!',
  },
};
