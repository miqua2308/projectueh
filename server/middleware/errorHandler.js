/**
 * Middleware xử lý lỗi tập trung (Centralized Error Handler)
 */
export function errorHandler(err, req, res, next) {
  console.error('[ServerError]', err);

  const status = err.status || 500;
  const message = err.message || 'Lỗi hệ thống nội bộ';

  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message
    }
  });
}
