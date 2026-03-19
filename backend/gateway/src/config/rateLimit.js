import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redisClient } from "./redis.js";

// 🔹 Helper to create NEW store every time
const createStore = (prefix) =>
  new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix
  });

// 🔹 Common config (NO store here)
const base = {
  standardHeaders: true,
  legacyHeaders: false,

  // ✅ FIXED key generator
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req),
};

// 🔹 Normal API limiter
export const limiter = rateLimit({
  ...base,
  store: createStore("rate-limit:"), // ✅ NEW instance
  windowMs: 15 * 60 * 1000,
  max: 600,
});

// 🔹 Bulk operations limiter
export const bulkLimiter = rateLimit({
  ...base,
  store: createStore("bulk-limit:"), // ✅ DIFFERENT instance + prefix
  windowMs: 60 * 1000,
  max: 20,
});