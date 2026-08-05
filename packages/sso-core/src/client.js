import { createPkcePair } from './pkce.js'
import { humanizeSsoError } from './errors.js'

/**
 * Default fetch implementation. Works in Node 18+ (global fetch) and in
 * most modern runtimes. Override via `options.fetch` if needed (e.g. to add
 * agent options, custom headers, or use ofetch/axios).
 */
function defaultFetch(url, init) {
  return fetch(url, { ...init, redirect: 'manual' })
}

/**
 * Framework-agnostic OIDC PKCE SSO client.
 *
 * Usage:
 * ```js
 * import { SsoClient, normalizeSsoConfig } from '@mbx92/sso-core'
 *
 * const sso = new SsoClient(normalizeSsoConfig({
 *   issuer: 'https://sso.example.com',
 *   clientId: 'my_app',
 *   clientSecret: 'secret',
 *   redirectUri: 'https://myapp.com/api/auth/sso/callback',
 * }))
 *
 * // Step 1 — redirect user to SSO
 * const { url, state, codeVerifier } = await sso.beginAuthorize()
 * // → res.redirect(302, url)
 * //   save state & codeVerifier in session/cookie
 *
 * // Step 2 — handle callback
 * const tokens = await sso.exchangeCode(code, codeVerifier)
 * const userInfo = await sso.fetchUserInfo(tokens.access_token)
 *
 * // Step 3 — check session validity
 * const valid = await sso.checkSession(userInfo.sub)
 * ```
 */
export class SsoClient {
  #config
  #fetch

  /**
   * @param {import('./index.js').SsoConfig} config - Normalized config from `normalizeSsoConfig()`
   */
  constructor(config) {
    if (!config.issuer) throw new Error('SsoClient: issuer is required')
    if (!config.clientId) throw new Error('SsoClient: clientId is required')
    this.#config = { ...config }
    this.#fetch = config.fetch || defaultFetch
  }

  get config() {
    return { ...this.#config }
  }

  // ── Authorize flow ──────────────────────────────────────────────

  /**
   * Generate PKCE pair and return the authorize URL + state.
   * Caller must store `state` and `codeVerifier` (cookie/session/token)
   * so they can be verified during the callback step.
   *
   * @param {object} [opts]
   * @param {string} [opts.scope]  - default 'openid profile email'
   * @param {string} [opts.redirectUri] - override default redirectUri
   * @returns {{ url: string, state: string, codeVerifier: string }}
   */
  beginAuthorize(opts) {
    const { codeVerifier, codeChallenge, state } = createPkcePair()
    const scope = opts?.scope || 'openid profile email'
    const redirectUri = opts?.redirectUri || this.#config.redirectUri

    if (!redirectUri) {
      throw new Error('SsoClient: redirectUri is required in config or opts')
    }

    const url = new URL(`${this.#config.issuer}/api/oidc/authorize`)
    url.searchParams.set('client_id', this.#config.clientId)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', scope)
    url.searchParams.set('state', state)
    url.searchParams.set('code_challenge', codeChallenge)
    url.searchParams.set('code_challenge_method', 'S256')

    return { url: url.toString(), state, codeVerifier }
  }

  // ── Token exchange ──────────────────────────────────────────────

  /**
   * Exchange authorization code for tokens.
   *
   * @param {string} code         - Authorization code from SSO callback
   * @param {string} codeVerifier - PKCE code verifier (stored from beginAuthorize)
   * @param {object} [opts]
   * @param {string} [opts.redirectUri] - override default redirectUri
   * @returns {Promise<{ access_token: string, id_token?: string, refresh_token?: string, expires_in?: number }>}
   * @throws {SsoError} on failure
   */
  async exchangeCode(code, codeVerifier, opts) {
    const redirectUri = opts?.redirectUri || this.#config.redirectUri

    if (!redirectUri) {
      throw new SsoError('redirectUri is required in config or opts')
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: String(code),
      redirect_uri: redirectUri,
      client_id: this.#config.clientId,
      client_secret: this.#config.clientSecret,
      code_verifier: codeVerifier,
    }).toString()

    const res = await this.#_fetchJson(`${this.#config.issuer}/api/oidc/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    if (!res.ok) {
      const errBody = await res.json().catch(() => null)
      throw new SsoError(
        humanizeSsoError(errBody?.statusMessage || errBody?.message || res.statusText),
        res.status,
        errBody,
      )
    }

    return res.json()
  }

  // ── Userinfo ────────────────────────────────────────────────────

  /**
   * Fetch user profile from SSO userinfo endpoint.
   *
   * @param {string} accessToken
   * @returns {Promise<{ sub: string, email?: string, name?: string, [key: string]: unknown }>}
   */
  async fetchUserInfo(accessToken) {
    const res = await this.#_fetchJson(`${this.#config.issuer}/api/oidc/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) {
      throw new SsoError('Gagal mengambil profil pengguna', res.status)
    }

    return res.json()
  }

  // ── Session check ───────────────────────────────────────────────

  /**
   * Validate whether the SSO issuer still considers this account active
   * (session hasn't been revoked or expired).
   *
   * @param {string} userId - The SSO account id (userInfo.sub)
   * @returns {Promise<boolean>}
   */
  async checkSession(userId) {
    if (!userId) return false

    try {
      const res = await this.#_fetchJson(`${this.#config.issuer}/api/auth/check-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (!res.ok) return false
      const body = await res.json().catch(() => null)
      return body?.valid === true
    }
    catch {
      return false
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────

  /**
   * Build a fail-redirect URL pointing at the app's login page with an
   * `?error=` query parameter.
   */
  failLoginRedirect(message) {
    const url = new URL(this.#config.loginPath, this.#config.appUrl)
    url.searchParams.set('error', message)
    return url.toString()
  }

  /**
   * Build a success redirect URL.
   */
  successRedirectUrl(path) {
    return new URL(path || this.#config.successRedirect, this.#config.appUrl).toString()
  }

  async #_fetchJson(url, init) {
    const finalInit = { ...init, redirect: 'manual' }

    let res
    try {
      res = await this.#fetch(url, finalInit)
    }
    catch (err) {
      throw new SsoError(
        humanizeSsoError(err?.message || 'Tidak dapat terhubung ke SSO'),
        0,
        null,
        err,
      )
    }

    return res
  }
}

/**
 * Error thrown by SsoClient operations.
 */
export class SsoError extends Error {
  status

  /** Raw body returned by SSO (parsed JSON) */
  body

  /** Underlying network error, if any */
  cause

  constructor(message, status = 0, body = null, cause = null) {
    super(message)
    this.name = 'SsoError'
    this.status = status
    this.body = body
    this.cause = cause
  }
}
