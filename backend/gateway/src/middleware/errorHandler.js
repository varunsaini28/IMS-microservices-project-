export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const payload = {
    level: 'error',
    msg: 'gateway_request_failed',
    requestId: req.requestId || null,
    method: req.method,
    path: req.originalUrl || req.path,
    userId: req.user?.id || null,
    status,
    error: {
      message: err.message,
      name: err.name,
    },
  };
  console.error(JSON.stringify(payload));
  res.status(status).json({
    error: err.message || 'Internal server error',
    requestId: req.requestId || undefined,
  });
};