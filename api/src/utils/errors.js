export class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function badRequest(message) {
  return new AppError(400, message);
}

export function unauthorized(message = 'Unauthorized') {
  return new AppError(401, message);
}

export function forbidden(message = 'Forbidden') {
  return new AppError(403, message);
}

export function notFound(message = 'Not Found') {
  return new AppError(404, message);
}
