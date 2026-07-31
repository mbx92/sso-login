import { useRuntimeConfig } from 'nitropack/runtime'
import {
  defineEventHandler,
  createError,
  setCookie,
  sendRedirect,
} from 'h3'
import { createPkcePair, getSsoConfig } from '../utils/sso.js'

export default defineEventHandler(async (event) => {
  const sso = getSsoConfig()
  if (!sso.enabled) {
    throw createError({ statusCode: 503, statusMessage: 'SSO belum dikonfigurasi' })
  }
  if (!sso.redirectUri) {
    throw createError({
      statusCode: 500,
      statusMessage: 'SSO_REDIRECT_URI / APP_URL belum dikonfigurasi',
    })
  }

  const { codeVerifier, codeChallenge, state } = createPkcePair()

  setCookie(event, sso.pkceCookie, JSON.stringify({ codeVerifier, state }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 10,
  })

  const authorizeUrl = new URL(`${sso.issuer}/api/oidc/authorize`)
  authorizeUrl.searchParams.set('client_id', sso.clientId)
  authorizeUrl.searchParams.set('redirect_uri', sso.redirectUri)
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('scope', 'openid profile email')
  authorizeUrl.searchParams.set('state', state)
  authorizeUrl.searchParams.set('code_challenge', codeChallenge)
  authorizeUrl.searchParams.set('code_challenge_method', 'S256')

  return sendRedirect(event, authorizeUrl.toString(), 302)
})
