import { defineEventHandler } from 'h3'
import { v4 as uuidv4 } from 'uuid'
import { logRequest, createRequestLogger } from '../services/logger.ts'

declare module 'h3' {
  interface H3EventContext {
    requestId: string
    requestStartTime: number
    logger: ReturnType<typeof createRequestLogger>
  }
}

/**
 * Request logging middleware
 * - Generates unique request ID
 * - Logs request start and completion
 * - Measures request duration
 */
export default defineEventHandler((event) => {
  // Generate unique request ID
  const requestId = event.node.req.headers['x-request-id'] as string || uuidv4()
  const startTime = Date.now()
  const path = event.node.req.url || '/'

  // Attach to context
  event.context.requestId = requestId
  event.context.requestStartTime = startTime
  event.context.logger = createRequestLogger(requestId, {
    method: event.method,
    path: path
  })

  // Set request ID header for tracing
  event.node.res.setHeader('x-request-id', requestId)

  // Log request start (debug level)
  event.context.logger.debug({
    method: event.method,
    url: path,
    userAgent: event.node.req.headers['user-agent'],
    ip: event.node.req.headers['x-forwarded-for'] || event.node.req.socket.remoteAddress
  }, 'Request started')

  // Hook into response to log completion
  event.node.res.on('finish', () => {
    const duration = Date.now() - startTime
    
    // Skip logging for static assets and health checks
    if (path.startsWith('/_nuxt/') || path.startsWith('/__nuxt') || path === '/health') {
      return
    }

    logRequest(
      event.method,
      path,
      event.node.res.statusCode,
      duration,
      requestId,
      {
        userAgent: event.node.req.headers['user-agent'] as string,
        ip: (event.node.req.headers['x-forwarded-for'] as string) || event.node.req.socket.remoteAddress
      }
    )
  })
})
