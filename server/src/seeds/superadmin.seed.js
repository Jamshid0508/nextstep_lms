import { User } from '../models/User.js';
import { ROLES } from '../constants/roles.js';
import { USER_STATUS } from '../constants/status.js';
import { hashPassword } from '../utils/password.util.js';
import { env } from '../config/env.js';

export async function ensureSuperAdmin() {
  const existing = await User.findOne({ role: ROLES.SUPER_ADMIN });
  if (existing) return;

  const passwordHash = await hashPassword(env.adminSeed.password);

  await User.create({
    fullName: env.adminSeed.name,
    phone: env.adminSeed.phone,
    email: env.adminSeed.email,
    passwordHash,
    role: ROLES.SUPER_ADMIN,
    status: USER_STATUS.ACTIVE,
  });

  console.log(`[seed] SUPER_ADMIN yaratildi: ${env.adminSeed.email} / ${env.adminSeed.password}`);
}
