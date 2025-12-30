import { db, oidcClients } from '../../db/index'
import { desc, count } from 'drizzle-orm'

function parseQuery(event: any): Record<string, string> {
  const url = event.node.req.url || ''
  const queryString = url.split('?')[1] || ''
  const params: Record<string, string> = {}
  
  if (queryString) {
    const pairs = queryString.split('&')
    for (const pair of pairs) {
      const [key, value] = pair.split('=')
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value)
      }
    }
  }
  
  return params
}

export default defineEventHandler(async (event) => {
  try {
    const query = parseQuery(event)
    const limit = query.limit ? parseInt(query.limit) : 50
    const offset = query.offset ? parseInt(query.offset) : 0

    // Get clients
    const clientList = await db
      .select()
      .from(oidcClients)
      .orderBy(desc(oidcClients.createdAt))
      .limit(limit)
      .offset(offset)

    // Get total count
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(oidcClients)

    const page = query.page ? parseInt(query.page) : 1

    return {
      data: clientList,
      pagination: {
        total,
        page,
        limit,
        offset,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    console.error('Error fetching clients:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch clients'
    })
  }
})
