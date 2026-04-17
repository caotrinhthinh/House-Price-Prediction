import rateLimit from "express-rate-limit";

export const predictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 10, // tối đa 10 request
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: "Too Many Requests",
    message: "Limit: 10 requests per minute",
    retryAfter: "60s",
  },
});
