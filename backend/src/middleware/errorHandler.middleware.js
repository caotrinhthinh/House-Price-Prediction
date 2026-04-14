export const errorHandler = (err, req, res, next) => {
  if (req.log) {
    req.log.error(`Unhandled error: ${err.message}`);
  } else {
    console.error(`Unhandled error: ${err.message}`);
  }

  if (err.message.includes("unavailable") || err.message.includes("Breaker is open")) {
    return res.status(503).json({
      status: 503,
      error: "Model Server Unavailable",
      message: err.message,
    });
  }

  return res.status(500).json({
    status: 500,
    error: "Internal Server Error",
    details: err.message
  });
};
