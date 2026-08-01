import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/token.util.js';
import { User } from '../models/User.js';
import { USER_STATUS } from '../constants/status.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw ApiError.unauthorized();
    }

    const token = header.slice('Bearer '.length);
    const payload = verifyAccessToken(token);

    const user = await User.findById(payload.sub);
    if (!user || user.status !== USER_STATUS.ACTIVE) {
      throw ApiError.unauthorized('Foydalanuvchi topilmadi yoki bloklangan');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(ApiError.unauthorized('Token yaroqsiz yoki muddati tugagan'));
  }
}
