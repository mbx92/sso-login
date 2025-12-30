import { defineEventHandler } from 'h3'

/**
 * OpenID Connect Discovery Endpoint
 * GET /.well-known/openid-configuration
 * 
 * Returns OpenID Provider metadata
 */
export default defineEventHandler((event) => {
  const baseUrl = process.env.SSO_ISSUER || 'http://localhost:3000'

  return {
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/api/oidc/authorize`,
    token_endpoint: `${baseUrl}/api/oidc/token`,
    userinfo_endpoint: `${baseUrl}/api/oidc/userinfo`,
    end_session_endpoint: `${baseUrl}/api/oidc/logout`,
    jwks_uri: `${baseUrl}/api/oidc/jwks`,
    
    response_types_supported: [
      'code'
    ],
    response_modes_supported: [
      'query'
    ],
    grant_types_supported: [
      'authorization_code',
      'refresh_token'
    ],
    subject_types_supported: [
      'public'
    ],
    id_token_signing_alg_values_supported: [
      'HS256'
    ],
    token_endpoint_auth_methods_supported: [
      'client_secret_basic',
      'client_secret_post',
      'none'
    ],
    code_challenge_methods_supported: [
      'S256'
    ],
    scopes_supported: [
      'openid',
      'profile',
      'email',
      'offline_access'
    ],
    claims_supported: [
      'sub',
      'iss',
      'aud',
      'exp',
      'iat',
      'email',
      'name',
      'employee_id',
      'department',
      'position',
      'avatar_url',
      'role_id',
      'role_name'
    ],
    service_documentation: `${baseUrl}/docs`,
    ui_locales_supported: [
      'en',
      'id'
    ]
  }
})
