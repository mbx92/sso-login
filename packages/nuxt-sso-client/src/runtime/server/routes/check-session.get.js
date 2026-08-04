import { defineEventHandler } from 'h3'
import { getSsoConfig, getSsoSession, validateSsoSession } from '../utils/sso.js'

/**
 * Validates that the current SSO session is still active on the issuer.
 * Reads the package's own session cookie (set in callback.get.js) —
 * no client-supplied token needed, so it's safe to call from anywhere.
 *
 * GET /api/auth/sso/check-session
 * Response: { valid: boolean }
 */
export default defineEventHandler(async (event) => {
  const sso = getSsoConfig()
  if (!sso.enabled) {
    return { valid: true }
  }

  const session = await getSsoSession(event, sso)
  const sub = session.data?.sub

  if (!sub) {
    // Not an SSO session (or predates this cookie) — nothing to check.
    return { valid: true }
  }

  const valid = await validateSsoSession(sso, sub)
  if (!valid) {
    await session.clear()
  }

  return { valid }
})
