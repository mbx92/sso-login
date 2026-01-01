import { defineEventHandler } from 'h3'
import { db } from '../db/index'
import { sql } from 'drizzle-orm'

/**
 * Health check endpoint for Docker/Kubernetes
 * GET /api/health
 */
export default defineEventHandler(async (event) => {
  const startTime = Date.now()
  
  try {
    // Check database connectivity
    await db.execute(sql`SELECT 1`)
    
    const responseTime = Date.now() - startTime
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      checks: {
        database: 'connected'
      }
    }
  } catch (error: any) {
    // Return 503 Service Unavailable if unhealthy
    event.node.res.statusCode = 503
    
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: 'disconnected'
      },
      error: error.message
    }
  }
})
