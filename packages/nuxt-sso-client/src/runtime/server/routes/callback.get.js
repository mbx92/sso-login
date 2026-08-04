import {
  defineEventHandler,
  getCookie,
  deleteCookie,
  getQuery,
  sendRedirect,
} from 'h3'
import { $fetch } from 'ofetch'
import resolveUser from '#mbx-sso-resolve-user'
import { getSsoConfig, failLoginRedirect, successRedirectUrl, getCallbackUri, getSsoSession } from '../utils/sso.js'

function readPkceCookie(event, cookieName) {
  const raw = getCookie(event, cookieName)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  }
  catch {
    return null
  }
}

export default defineEventHandler(async (event) => {
  const sso = getSsoConfig()
  const query = getQuery(event)

  if (!sso.enabled) {
    return sendRedirect(event, failLoginRedirect(sso, 'SSO belum dikonfigurasi'), 302)
  }

  if (query.error) {
    return sendRedirect(
      event,
      failLoginRedirect(sso, String(query.error_description || query.error)),
      302,
    )
  }

  const code = query.code
  const state = query.state
  const pkce = readPkceCookie(event, sso.pkceCookie)
  deleteCookie(event, sso.pkceCookie, { path: '/' })

  if (!code || !state || !pkce?.codeVerifier || pkce.state !== state) {
    return sendRedirect(event, failLoginRedirect(sso, 'SSO state tidak valid. Coba lagi.'), 302)
  }

  try {
    const redirectUri = getCallbackUri(event, sso)
    const tokenRes = await $fetch(`${sso.issuer}/api/oidc/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: redirectUri,
        client_id: sso.clientId,
        client_secret: sso.clientSecret,
        code_verifier: pkce.codeVerifier,
      }).toString(),
    })

    const userInfo = await $fetch(`${sso.issuer}/api/oidc/userinfo`, {
      headers: { Authorization: `Bearer ${tokenRes.access_token}` },
    })

    const email = String(userInfo?.email || '').toLowerCase().trim()
    if (!email) {
      return sendRedirect(event, failLoginRedirect(sso, 'SSO tidak mengembalikan email'), 302)
    }

    const result = await resolveUser(event, {
      userInfo: { ...userInfo, email },
      tokens: tokenRes,
      sso,
    })

    // Own session, separate from whatever the host app stores — lets
    // check-session work without the host exposing the SSO account id.
    const ssoSession = await getSsoSession(event, sso)
    await ssoSession.update({ sub: userInfo.sub })

    const redirectTo = result?.redirectTo || sso.successRedirect
    return sendRedirect(event, successRedirectUrl(sso, redirectTo), 302)
  }
  catch (error) {
    console.error('[@mbx92/nuxt-sso-client] callback error:', error)
    const raw =
      error?.data?.statusMessage ||
      error?.data?.message ||
      error?.statusMessage ||
      error?.message ||
      'Login SSO gagal'
    const message = humanizeSsoError(raw)
    return sendRedirect(event, failLoginRedirect(sso, message), 302)
  }
})

function humanizeSsoError(raw) {
  const text = String(raw || '')
  if (
    /failed\s+query|select\s+|insert\s+|update\s+|delete\s+|relation\s+"|params:\s*|ECONNREFUSED|syntax\s+error/i.test(text)
    || text.length > 160
  ) {
    if (/does not exist|relation/i.test(text)) {
      return 'Database aplikasi belum siap. Hubungi administrator.'
    }
    return 'Login SSO gagal. Silakan coba lagi.'
  }
  return text || 'Login SSO gagal'
}