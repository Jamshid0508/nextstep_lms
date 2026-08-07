import 'dotenv/config';



export const env = {
  port: Number(process.env.PORT ?? 5000),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  mongoUri: process.env.MONGO_URI ?? 'mongodb+srv://jamshidpanjiyev98_db_user:6UQsNsiDV3lWpNVW@nextstepdb.jdqdcml.mongodb.net/',

  jwtSecret: process.env.JWT_SECRET ?? 'change-me-access-secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh-secret',
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
