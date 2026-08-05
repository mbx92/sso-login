import { createHmac } from 'node:crypto'
import { SsoClient, normalizeSsoConfig, sessionPassword } from '@mbx92/sso-core'

// ── Cookie helpers (zero-dependency — no cookie-parser needed) ─────

function parseCookies(req) {
  const header = req.headers.cookie
  if (!header) return {}
  const map = {}
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const key = part.slice(0, idx).trim()
    const val = part.slice(idx + 1).trim()
    if (!map[key]) map[key] = decodeURIComponent(val)
  }
  return map
}

function sign(val, secret) {
  return val + '.' + createHmac('sha256', secret).update(val).digest('base64url')
}

function unsign(input, secret) {
  const idx = input.lastIndexOf('.')
  if (idx === -1) return false
  const val = input.slice(0, idx)
  const mac = createHmac('sha256', secret).update(val).digest('base64url')
  // Constant-time comparison
  const a = Buffer.from(mac)
  const b = Buffer.from(input.slice(idx + 1))
  if (a.length !== b.length) return false
  return a.every((v, i) => v === b[i]) ? val : false
}

// ── PKCE cookie helpers ────────────────────────────────────────────

const PKCE_MAX_AGE = 60 * 10 // 10 minutes

function setPkceCookie(res, name, data, secure) {
  const value = encodeURIComponent(JSON.stringify(data))
  res.setHeader('Set-Cookie', serializeCookie(name, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: PKCE_MAX_AGE,
  }))
}

function readPkceCookie(req, name) {
  const cookies = parseCookies(req)
  const raw = cookies[name]
  if (!raw) return null
  try {
    return JSON.parse(decodeURIComponent(raw))
  }
  catch {
    return null
  }
}

function clearPkceCookie(res, name, secure) {
  res.setHeader('Set-Cookie', serializeCookie(name, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 0,
  }))
}

// ── SSO session cookie helpers ─────────────────────────────────────

function setSsoCookie(res, name, data, secret, secure) {
  const payload = JSON.stringify(data)
  const value = encodeURIComponent(sign(payload, secret))
  res.setHeader('Set-Cookie', serializeCookie(name, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
  }))
}

function readSsoCookie(req, name, secret) {
  const cookies = parseCookies(req)
  const raw = cookies[name]
  if (!raw) return null
  const unsigned = unsign(decodeURIComponent(raw), secret)
  if (!unsigned) return null
  try {
    return JSON.parse(unsigned)
  }
  catch {
    return null
  }
}

function clearSsoCookie(res, name, secure) {
  res.setHeader('Set-Cookie', serializeCookie(name, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 0,
  }))
}

// ── Cookie serialization (RFC 6265) ────────────────────────────────

function serializeCookie(name, value, opts = {}) {
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`
  if (opts.maxAge !== undefined) cookie += `; Max-Age=${opts.maxAge}`
  if (opts.path) cookie += `; Path=${opts.path}`
  if (opts.httpOnly) cookie += '; HttpOnly'
  if (opts.secure) cookie += '; Secure'
  if (opts.sameSite) cookie += `; SameSite=${opts.sameSite.charAt(0).toUpperCase() + opts.sameSite.slice(1)}`
  return cookie
}

// ── Express Router factory ─────────────────────────────────────────

/**
 * Create Express middleware for SSO login / callback / check-session routes.
 *
 * Mount with: `app.use('/api/auth/sso', await createSsoMiddleware({...}))`
 *
 * @param {object} options
 * @param {object} options.client - {@link import('@mbx92/sso-core').SsoConfig} raw config
 * @param {function} options.resolveUser - async (req, { userInfo, tokens }) => { redirectTo? }
 *   Called after successful token exchange + userinfo fetch.
 *   Use this to find-or-create a local user and store it in req.session.
 *   Return `{ redirectTo: '/some/path' }` to override the default success redirect.
 * @returns {Promise<function>} Express middleware `(req, res, next) => void`
 *
 * @example
 * ```js
 * import express from 'express'
 * import session from 'express-session'
 * import { createSsoMiddleware } from '@mbx92/sso-express'
 *
 * const app = express()
 * app.use(session({ secret: 'my-secret', resave: false, saveUninitialized: false }))
 *
 * const ssoMiddleware = await createSsoMiddleware({
 *   client: {
 *     issuer: 'https://sso.example.com',
 *     clientId: 'my_app',
 *     clientSecret: 's3cret',
 *     appUrl: 'https://myapp.com',
 *   },
 *   async resolveUser(req, { userInfo, tokens }) {
 *     let user = await db.findByEmail(userInfo.email)
 *     if (!user) user = await db.create({ email: userInfo.email, name: userInfo.name })
 *     req.session.userId = user.id
 *   },
 * })
 *
 * app.use('/api/auth/sso', ssoMiddleware)
 * app.listen(3000)
 * ```
 */
export async function createSsoMiddleware(options) {
  const { resolveUser } = options
  if (typeof resolveUser !== 'function') {
    throw new Error('createSsoMiddleware: resolveUser function is required')
  }

  const rawConfig = normalizeSsoConfig(options.client || {})
  const client = new SsoClient(rawConfig)
  const pkceCookieName = options.client?.pkceCookie || 'mbx_sso_pkce'
  const sessionCookieName = options.client?.sessionCookie || 'mbx_sso_session'
  const sessionSecret = sessionPassword(rawConfig)
  const isSecure = rawConfig.appUrl?.startsWith('https://')

  // Thin Express-compatible router — avoids a hard require('express')
  // so this package works in pure ESM without extra setup.
  const stack = []
  const router = {
    get(path, handler) {
      stack.push({ method: 'GET', path, handler })
    },
    _dispatch(req, res, next) {
      let idx = 0
      const run = () => {
        if (idx >= stack.length) return next()
        const r = stack[idx++]
        if (r.method !== req.method) return run()
        // Match path exactly (assumes mounting at a prefix)
        if (req._ssoPath !== r.path) return run()
        try {
          const result = r.handler(req, res, (err) => {
            if (err) return next(err)
            run()
          })
          if (result && typeof result.catch === 'function') {
            result.catch(next)
          }
        }
        catch (err) {
          next(err)
        }
      }
      run()
    },
  }

  // ── Route handlers ──────────────────────────────────────────────

  const routes = {
    '/login': (req, res) => {
      try {
        const { url, state, codeVerifier } = client.beginAuthorize()
        setPkceCookie(res, pkceCookieName, { codeVerifier, state }, isSecure)
        return res.redirect(302, url)
      }
      catch (err) {
        console.error('[@mbx92/sso-express] login error:', err.message)
        return res.redirect(302, client.failLoginRedirect('SSO tidak tersedia'))
      }
    },

    '/callback': async (req, res) => {
      const query = req.query

      if (query.error) {
        return res.redirect(302, client.failLoginRedirect(
          String(query.error_description || query.error),
        ))
      }

      const code = query.code
      const state = query.state
      const pkce = readPkceCookie(req, pkceCookieName)
      clearPkceCookie(res, pkceCookieName, isSecure)

      if (!code || !state || !pkce?.codeVerifier || pkce.state !== state) {
        return res.redirect(302, client.failLoginRedirect('SSO state tidak valid. Coba lagi.'))
      }

      try {
        const tokens = await client.exchangeCode(code, pkce.codeVerifier)
        const userInfo = await client.fetchUserInfo(tokens.access_token)

        const email = String(userInfo?.email || '').toLowerCase().trim()
        if (!email) {
          return res.redirect(302, client.failLoginRedirect('SSO tidak mengembalikan email'))
        }

        const result = await resolveUser(req, {
          userInfo: { ...userInfo, email },
          tokens,
        })

        // Store SSO account id in package's own cookie for check-session
        setSsoCookie(res, sessionCookieName, { sub: userInfo.sub }, sessionSecret, isSecure)

        const redirectTo = result?.redirectTo || client.config.successRedirect
        return res.redirect(302, client.successRedirectUrl(redirectTo))
      }
      catch (err) {
        console.error('[@mbx92/sso-express] callback error:', err)

        if (err.name === 'SsoError') {
          return res.redirect(302, client.failLoginRedirect(err.message))
        }

        return res.redirect(302, client.failLoginRedirect('Login SSO gagal. Silakan coba lagi.'))
      }
    },

    '/check-session': async (req, res) => {
      const data = readSsoCookie(req, sessionCookieName, sessionSecret)
      const sub = data?.sub

      if (!sub) {
        return res.json({ valid: true })
      }

      const valid = await client.checkSession(sub)
      if (!valid) {
        clearSsoCookie(res, sessionCookieName, isSecure)
      }

      return res.json({ valid })
    },
  }

  // Return middleware function. When mounted with app.use('/prefix', ...),
  // Express strips the prefix from req.path automatically.
  return function ssoMiddleware(req, res, next) {
    const handler = routes[req.path]
    if (!handler) return next()

    handler(req, res).catch(next)
  }
}
