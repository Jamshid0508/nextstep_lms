import { ApiError } from '../utils/ApiError.js';
import { fail } from '../utils/apiResponse.js';

export function notFoundHandler(req, res) {
  fail(res, 404, 'NOT_FOUND', `Route topilmadi: ${req.method} ${req.originalUrl}`);
}

export function errorHandler(err, req, res, _next) {
  if (err instanceof ApiError) {
    return fail(res, err.status, err.code, err.message, err.details);
  }

  if (err?.name === 'ValidationError') {
    return fail(res, 400, 'VALIDATION_ERROR', err.message);
  }

  if (err?.code === 11000) {
    return fail(res, 409, 'DUPLICATE_KEY', 'Bu qiymat allaqachon mavjud', err.keyValue);
  }

  console.error(err);
  return fail(res, 500, 'INTERNAL_ERROR', 'Serverda kutilmagan xatolik yuz berdi');
}
