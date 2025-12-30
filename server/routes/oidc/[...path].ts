import { defineEventHandler, getRequestURL, readBody } from 'h3'
import { getOidcProvider } from '../../oidc/provider.ts'

/**
 * OIDC Provider catch-all route
 * Handles all OIDC endpoints: /oidc/*
 * - /.well-known/openid-configuration
 * - /oidc/auth (authorize)
 * - /oidc/token
 * - /oidc/userinfo
 * - /oidc/end-session (logout)
 * - /oidc/jwks
 * - /oidc/introspect
 * - /oidc/revoke
 */
export default defineEventHandler(async (event) => {
  const provider = getOidcProvider()
  const callback = provider.callback()

  // Convert H3 request/response to Node.js format for oidc-provider
  const req = event.node.req
  const res = event.node.res

  // Adjust URL path for oidc-provider (remove /oidc prefix if needed)
  const originalUrl = req.url || ''
  
  // oidc-provider expects the callback at specific paths
  // We need to pass through the request to Koa-based oidc-provider
  return new Promise((resolve, reject) => {
    // Create a mock Koa context
    callback(req, res)
      .then(() => {
        // Response is already sent by oidc-provider
        resolve(undefined)
      })
      .catch((error) => {
        event.context.logger?.error({ error }, 'OIDC callback error')
        reject(error)
      })
  })
})
