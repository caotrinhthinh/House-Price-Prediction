import CircuitBreaker from "opossum";
import axios from "axios";
import { logger } from "../utils/logger.js";

const callModelServerFn = async (data) => {
  const modelUrl = process.env.MODEL_SERVER_URL || "http://localhost:5000";
  const res = await axios.post(`${modelUrl}/predict`, data, { timeout: 10000 });
  return res.data; // Trả về nguyên toàn bộ JSON từ model server (bao gồm data.price, data.details...)
};

const options = {
  timeout: 10000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
};

export const modelBreaker = new CircuitBreaker(callModelServerFn, options);

modelBreaker.fallback(() => {
  throw new Error("Model server is currently unavailable. Please try again later.");
});

modelBreaker.on("open", () => logger.warn("Circuit breaker OPEN"));
modelBreaker.on("halfOpen", () => logger.info("Circuit breaker HALF-OPEN"));
modelBreaker.on("close", () => logger.info("Circuit breaker CLOSED"));
