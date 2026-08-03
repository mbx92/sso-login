import { defineEventHandler, createError } from "h3";
import { logger } from "../services/logger.js";
const rateLimitStore = /* @__PURE__ */ new Map();
const RATE_LIMIT_CONFIG = {
  // Brute-force protection for credential submission only.
  // Do NOT rate-limit GET /login — page refreshes / HMR / OIDC redirects
  // easily exceed a low page-view budget and return 429.
  "/api/auth/login": { maxRequests: 10, windowMs: 60 * 1e3 },
  "/api/oidc/token": { maxRequests: 30, windowMs: 60 * 1e3 },
  "/api/oidc/authorize": { maxRequests: 60, windowMs: 60 * 1e3 },
};
const RATE_LIMITED_PATHS = Object.keys(RATE_LIMIT_CONFIG);

function getRateLimitConfig(path) {
  // Strip query string so /api/auth/login?x=1 shares the same bucket
  const pathname = path.split("?")[0];
  for (const [pattern, config] of Object.entries(RATE_LIMIT_CONFIG)) {
    if (pathname === pattern || pathname.startsWith(pattern + "/")) {
      return config;
    }
  }
  return null;
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
if (!globalThis.__ssoRateLimitCleanup) {
  globalThis.__ssoRateLimitCleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now >= entry.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 60 * 1e3);
  // Allow process to exit cleanly in tests / worker restarts
  if (typeof globalThis.__ssoRateLimitCleanup.unref === "function") {
    globalThis.__ssoRateLimitCleanup.unref();
  }
}
var rate_limit_default = defineEventHandler((event) => {
  const rawUrl = event.node.req.url || "/";
  const pathname = rawUrl.split("?")[0];
  if (!RATE_LIMITED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return;
  }
  const forwardedFor = event.node.req.headers["x-forwarded-for"];
  const clientIp = (typeof forwardedFor === "string" ? forwardedFor.split(",")[0]?.trim() : null) || event.node.req.socket.remoteAddress || "unknown";
  // Bucket by path without query string
  const rateLimitKey = `${clientIp}:${pathname}`;
  const config = getRateLimitConfig(pathname);
  if (!config) return;
  const result = checkRateLimit(rateLimitKey, config.maxRequests, config.windowMs);
  event.node.res.setHeader("X-RateLimit-Limit", config.maxRequests);
  event.node.res.setHeader("X-RateLimit-Remaining", result.remaining);
  event.node.res.setHeader("X-RateLimit-Reset", Math.ceil(result.resetAt / 1e3));
  if (!result.allowed) {
    logger.warn({
      requestId: event.context.requestId,
      clientIp,
      path: pathname,
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
