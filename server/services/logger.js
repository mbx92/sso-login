import pino from "pino";
const SENSITIVE_KEYS = [
  "password",
  "passwordHash",
  "password_hash",
  "client_secret",
  "clientSecret",
  "secret",
  "token",
  "access_token",
  "refresh_token",
  "id_token",
  "authorization",
  "cookie",
  "set-cookie"
];
function maskSensitive(obj, depth = 0) {
  if (depth > 10) return "[MAX_DEPTH]";
  if (obj === null || obj === void 0) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => maskSensitive(item, depth + 1));
  }
  const masked = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some((s) => lowerKey.includes(s))) {
      masked[key] = "[REDACTED]";
    } else if (typeof value === "object") {
      masked[key] = maskSensitive(value, depth + 1);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}
const getLogLevel = () => {
  return process.env.LOG_LEVEL || "info";
};
const logger = pino({
  level: getLogLevel(),
  formatters: {
    level: (label) => ({ level: label })
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: SENSITIVE_KEYS.map((k) => `*.${k}`),
    censor: "[REDACTED]"
  },
  ...process.env.NODE_ENV !== "production" && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname"
      }
    }
  }
});
function createRequestLogger(requestId, context) {
  return logger.child({
    requestId,
    ...maskSensitive(context)
  });
}
function logRequest(method, path, statusCode, durationMs, requestId, extra) {
  const logData = {
    requestId,
    method,
    path,
    statusCode,
    durationMs,
    ...extra && maskSensitive(extra)
  };
  if (statusCode >= 500) {
    logger.error(logData, "Request failed");
  } else if (statusCode >= 400) {
    logger.warn(logData, "Request error");
  } else {
    logger.info(logData, "Request completed");
  }
}
export {
  createRequestLogger,
  logRequest,
  logger,
  maskSensitive
};
