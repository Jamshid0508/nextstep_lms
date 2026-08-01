import { ApiError } from '../utils/ApiError.js';

export function validateBody(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(ApiError.badRequest('Yuborilgan ma\'lumotlar noto\'g\'ri', result.error.flatten()));
    }
    req.body = result.data;
    next();
  };
}
