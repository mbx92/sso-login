import pino from 'pino'

// Sensitive keys to mask in logs
const SENSITIVE_KEYS = [
  'password',
  'passwordHash',
  'password_hash',
  'client_secret',
  'clientSecret',
  'secret',
  'token',
  'access_token',
  'refresh_token',
  'id_token',
  'authorization',
  'cookie',
  'set-cookie'
]

/**
 * Recursively mask sensitive values in an object
 */
function maskSensitive(obj: unknown, depth = 0): unknown {
  if (depth > 10) return '[MAX_DEPTH]'
  
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj

  if (Array.isArray(obj)) {
    return obj.map(item => maskSensitive(item, depth + 1))
  }

  const masked: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase()
    if (SENSITIVE_KEYS.some(s => lowerKey.includes(s))) {
      masked[key] = '[REDACTED]'
    } else if (typeof value === 'object') {
      masked[key] = maskSensitive(value, depth + 1)
    } else {
      masked[key] = value
    }
  }
  return masked
}

// Get log level from environment
const getLogLevel = (): string => {
  return process.env.LOG_LEVEL || 'info'
}

// Create pino logger instance
export const logger = pino({
  level: getLogLevel(),
  formatters: {
    level: (label) => ({ level: label })
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: SENSITIVE_KEYS.map(k => `*.${k}`),
    censor: '[REDACTED]'
  },
  ...(process.env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    }
  })
})

/**
 * Create a child logger with request context
 */
export function createRequestLogger(requestId: string, context?: Record<string, unknown>) {
  return logger.child({
    requestId,
    ...maskSensitive(context)
  })
}

/**
 * Log request/response details safely
 */
export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
  requestId: string,
  extra?: Record<string, unknown>
) {
  const logData = {
    requestId,
    method,
    path,
    statusCode,
    durationMs,
    ...(extra && maskSensitive(extra))
  }

  if (statusCode >= 500) {
    logger.error(logData, 'Request failed')
  } else if (statusCode >= 400) {
    logger.warn(logData, 'Request error')
  } else {
    logger.info(logData, 'Request completed')
  }
}

export { maskSensitive }
