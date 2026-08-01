import crypto from 'node:crypto';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { AuditLog } from '../models/AuditLog.js';
import { AUDIT_ACTIONS } from '../constants/audit.js';
import { USER_STATUS } from '../constants/status.js';
import { comparePassword, hashPassword } from '../utils/password.util.js';
import {
  hashToken,
  refreshExpiryDate,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/token.util.js';
import { ApiError } from '../utils/ApiError.js';
import { ok } from '../utils/apiResponse.js';

async function issueTokens(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: refreshExpiryDate(),
  });

  return { accessToken, refreshToken };
}

function toPublicUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    phone: user.phone,
    email: user.email,
    role: user.role,
    status: user.status,
    branchId: user.branchId,
  };
}

export async function login(req, res, next) {
  try {
    const { login: loginValue, password } = req.body;

    const user = await User.findOne({
      $or: [{ phone: loginValue }, { email: loginValue.toLowerCase() }],
    });

    if (!user || !(await comparePassword(password, user.passwordHash))) {
      throw ApiError.unauthorized("Login yoki parol noto'g'ri");
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      throw ApiError.forbidden('Hisobingiz bloklangan. Administratorga murojaat qiling.');
    }

    const { accessToken, refreshToken } = await issueTokens(user);

    user.lastLoginAt = new Date();
    await user.save();

    await AuditLog.create({
      userId: user._id,
      action: AUDIT_ACTIONS.LOGIN,
      entityType: 'User',
      entityId: user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    ok(res, { user: toPublicUser(user), accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw ApiError.badRequest('refreshToken talab qilinadi');

    const payload = verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);

    const stored = await RefreshToken.findOne({ userId: payload.sub, tokenHash });
    if (!stored || stored.expiresAt < new Date()) {
      throw ApiError.unauthorized('Refresh token yaroqsiz');
    }

    const user = await User.findById(payload.sub);
    if (!user || user.status !== USER_STATUS.ACTIVE) {
      throw ApiError.unauthorized();
    }

    await stored.deleteOne();
    const tokens = await issueTokens(user);

    ok(res, { user: toPublicUser(user), ...tokens });
  } catch (err) {
    next(ApiError.unauthorized('Refresh token yaroqsiz yoki muddati tugagan'));
  }
}

export async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await RefreshToken.deleteOne({ tokenHash: hashToken(refreshToken) });
    }
    ok(res, { message: 'Chiqish muvaffaqiyatli' });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res) {
  ok(res, toPublicUser(req.user));
}

export async function forgotPassword(req, res, next) {
  try {
    const { login: loginValue } = req.body;
    const user = await User.findOne({
      $or: [{ phone: loginValue }, { email: loginValue.toLowerCase() }],
    });

    // Foydalanuvchi mavjud emasligini oshkor qilmaslik uchun har doim bir xil javob qaytariladi.
    if (!user) {
      return ok(res, { message: "Agar hisob mavjud bo'lsa, tiklash ko'rsatmasi yuborildi" });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordTokenHash = hashToken(rawToken);
    user.resetPasswordExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    // MVP: token konsolga chiqariladi (SMS/Email integratsiyasi Phase 2'da).
    console.log(`[auth] Parolni tiklash tokeni (${user.phone}): ${rawToken}`);

    ok(res, { message: "Agar hisob mavjud bo'lsa, tiklash ko'rsatmasi yuborildi" });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    const tokenHash = hashToken(token);

    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: { $gt: new Date() },
    });

    if (!user) throw ApiError.badRequest("Tiklash tokeni yaroqsiz yoki muddati tugagan");

    user.passwordHash = await hashPassword(password);
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();

    await RefreshToken.deleteMany({ userId: user._id });

    ok(res, { message: 'Parol muvaffaqiyatli tiklandi' });
  } catch (err) {
    next(err);
  }
}
