export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  console.error(
    JSON.stringify({
      level: 'error',
      msg: 'projects_service_request_failed',
      requestId: req.requestId || null,
      method: req.method,
      path: req.originalUrl || req.path,
      userId: req.user?.id || null,
      status,
      error: { message: err.message, name: err.name },
    })
  );
  res.status(status).json({ error: err.message || 'Internal server error', requestId: req.requestId || undefined });
};