export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Autentifikatsiya talab qilinadi') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = "Ruxsat yo'q") {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Topilmadi') {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static conflict(message) {
    return new ApiError(409, 'CONFLICT', message);
  }
}
