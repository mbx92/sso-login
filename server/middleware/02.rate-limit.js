import { defineEventHandler, createError } from "h3";
import { logger } from "../services/logger.js";
const rateLimitStore = /* @__PURE__ */ new Map();
const RATE_LIMIT_CONFIG = {
  // Login endpoint: 5 attempts per minute
  "/api/auth/login": { maxRequests: 5, windowMs: 60 * 1e3 },
  "/login": { maxRequests: 10, windowMs: 60 * 1e3 },
  // Token endpoint: 30 requests per minute
  "/oidc/token": { maxRequests: 30, windowMs: 60 * 1e3 },
  // Default for other protected endpoints
  default: { maxRequests: 100, windowMs: 60 * 1e3 }
};
const RATE_LIMITED_PATHS = ["/api/auth/login", "/login", "/oidc/token", "/oidc/authorize"];
function getRateLimitConfig(path) {
  for (const [pattern, config] of Object.entries(RATE_LIMIT_CONFIG)) {
    if (pattern !== "default" && path.startsWith(pattern)) {
      return config;
    }
  }
  return RATE_LIMIT_CONFIG.default;
}
function checkRateLimit(key, maxRequests, windowMs) {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now >= entry.resetAt) {
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }
  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  entry.count++;
  rateLimitStore.set(key, entry);
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1e3);
var rate_limit_default = defineEventHandler((event) => {
  const path = event.node.req.url || "/";
  if (!RATE_LIMITED_PATHS.some((p) => path.startsWith(p))) {
    return;
  }
  const forwardedFor = event.node.req.headers["x-forwarded-for"];
  const clientIp = (typeof forwardedFor === "string" ? forwardedFor.split(",")[0]?.trim() : null) || event.node.req.socket.remoteAddress || "unknown";
  const rateLimitKey = `${clientIp}:${path}`;
  const config = getRateLimitConfig(path);
  const result = checkRateLimit(rateLimitKey, config.maxRequests, config.windowMs);
  event.node.res.setHeader("X-RateLimit-Limit", config.maxRequests);
  event.node.res.setHeader("X-RateLimit-Remaining", result.remaining);
  event.node.res.setHeader("X-RateLimit-Reset", Math.ceil(result.resetAt / 1e3));
  if (!result.allowed) {
    logger.warn({
      requestId: event.context.requestId,
      clientIp,
      path,
      message: "Rate limit exceeded"
    }, "Rate limit exceeded");
    throw createError({
      statusCode: 429,
      statusMessage: "Too Many Requests",
      message: "Rate limit exceeded. Please try again later."
    });
  }
});
export {
  rate_limit_default as default
};
