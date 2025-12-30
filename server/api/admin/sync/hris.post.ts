import { defineEventHandler, createError, getHeader } from 'h3'
import { syncHrisUsers } from '../../../jobs/sync-hris.ts'

/**
 * Manually trigger HRIS sync
 * POST /api/admin/sync/hris
 */
export default defineEventHandler(async (event) => {
  // TODO: Add admin auth middleware check (superadmin only)
  
  try {
    const result = await syncHrisUsers(event.context.requestId)

    if (!result.success) {
      return {
        success: false,
        message: 'HRIS sync completed with errors',
        result
      }
    }

    return {
      success: true,
      message: 'HRIS sync completed successfully',
      result
    }
  } catch (error: any) {
    event.context.logger?.error({ error }, 'Failed to run HRIS sync')
    
    throw createError({
      statusCode: 500,
      message: `HRIS sync failed: ${error.message}`
    })
  }
})
