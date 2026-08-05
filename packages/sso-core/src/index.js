export { SsoClient, SsoError } from './client.js'
export { normalizeSsoConfig, sessionPassword } from './config.js'
export { createPkcePair } from './pkce.js'
export { humanizeSsoError } from './errors.js'

/**
 * @typedef {object} SsoConfig
 * @property {string} issuer           - SSO issuer URL (e.g. https://sso.example.com)
 * @property {string} clientId         - OIDC client ID
 * @property {string} clientSecret     - OIDC client secret
 * @property {string} redirectUri      - OAuth redirect_uri for the callback
 * @property {string} [appUrl]         - Base URL of this app (default http://localhost:3000)
 * @property {string} [successRedirect] - Where to redirect after login (default: /)
 * @property {string} [loginPath]      - Login page path (default: /login)
 * @property {function} [fetch]        - Custom fetch implementation
 */
