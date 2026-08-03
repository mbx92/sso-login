import {
  defineEventHandler,
  readBody,
  createError,
} from 'h3'
import { $fetch } from 'ofetch'
import { getSsoConfig } from '../utils/sso.js'

/**
 * Proxy route: validates the current SSO session by calling the SSO issuer.
 * The host app should store the `access_token` from the callback in its
 * own session and pass it here.
 *
 * POST /api/auth/sso/check-session
 * Body: { access_token: string }
 * Response: { valid: boolean }
 */
export default defineEventHandler(async (event) => {
  const sso = getSsoConfig()
  if (!sso.enabled) {
    throw createError({ statusCode: 503, message: 'SSO not configured' })
  }

  const body = await readBody(event)
  const accessToken = body?.access_token

  if (!accessToken) {
    return { valid: false }
  }

  try {
    const result = await $fetch(`${sso.issuer}/api/auth/check-session`, {
      method: 'POST',
      body: { access_token: accessToken },
      headers: { 'Content-Type': 'application/json' },
      ignoreResponseError: true,
    })
    return { valid: result?.valid === true }
  }
  catch (error) {
    console.error('[@mbx92/nuxt-sso-client] session check failed:', error.message)
    return { valid: false }
  }
})
