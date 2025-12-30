import { defineEventHandler, createError } from 'h3'
import { logger } from '../services/logger.ts'

// Simple in-memory rate limiter
interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Configuration
const RATE_LIMIT_CONFIG = {
  // Login endpoint: 5 attempts per minute
  '/api/auth/login': { maxRequests: 5, windowMs: 60 * 1000 },
  '/login': { maxRequests: 10, windowMs: 60 * 1000 },
  // Token endpoint: 30 requests per minute
  '/oidc/token': { maxRequests: 30, windowMs: 60 * 1000 },
  // Default for other protected endpoints
  default: { maxRequests: 100, windowMs: 60 * 1000 }
}

// Paths that should be rate limited
const RATE_LIMITED_PATHS = ['/api/auth/login', '/login', '/oidc/token', '/oidc/authorize']

/**
 * Get rate limit configuration for a path
 */
function getRateLimitConfig(path: string) {
  for (const [pattern, config] of Object.entries(RATE_LIMIT_CONFIG)) {
    if (pattern !== 'default' && path.startsWith(pattern)) {
      return config
    }
  }
  return RATE_LIMIT_CONFIG.default
}

/**
 * Check if rate limit is exceeded
 */
function checkRateLimit(key: string, maxRequests: number, windowMs: number): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now >= entry.resetAt) {
    // New window
    const resetAt = now + windowMs
    rateLimitStore.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: maxRequests - 1, resetAt }
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  rateLimitStore.set(key, entry)
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt }
}

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetAt) {
      rateLimitStore.delete(key)
    }
  }
}, 60 * 1000) // Every minute

/**
 * Rate limiting middleware
 */
export default defineEventHandler((event) => {
  const path = event.node.req.url || '/'
  
  // Only apply rate limiting to specific paths
  if (!RATE_LIMITED_PATHS.some(p => path.startsWith(p))) {
    return
  }

  // Get client identifier (IP address)
  const forwardedFor = event.node.req.headers['x-forwarded-for']
  const clientIp = (typeof forwardedFor === 'string' ? forwardedFor.split(',')[0]?.trim() : null)
    || event.node.req.socket.remoteAddress 
    || 'unknown'

  const rateLimitKey = `${clientIp}:${path}`
  const config = getRateLimitConfig(path)
  const result = checkRateLimit(rateLimitKey, config.maxRequests, config.windowMs)

  // Set rate limit headers
  event.node.res.setHeader('X-RateLimit-Limit', config.maxRequests)
  event.node.res.setHeader('X-RateLimit-Remaining', result.remaining)
  event.node.res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000))

  if (!result.allowed) {
    logger.warn({
      requestId: event.context.requestId,
      clientIp,
      path,
      message: 'Rate limit exceeded'
    }, 'Rate limit exceeded')

    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.'
    })
  }
})
