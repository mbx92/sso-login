/**
 * CORS Middleware for OIDC endpoints
 * Allows cross-origin requests from registered clients
 */
export default defineEventHandler((event) => {
  const req = event.node?.req || event.req
  const res = event.node?.res || event.res
  const url = req.url || ''
  const origin = req.headers.origin

  // Only apply CORS to OIDC endpoints
  if (url.startsWith('/api/oidc/')) {
    // Set CORS headers
    // In production, you should validate origin against registered client redirect URIs
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin)
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*')
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Max-Age', '86400')

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      res.end()
      return
    }
  }
})
