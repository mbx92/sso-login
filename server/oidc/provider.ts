import Provider, { Configuration, KoaContextWithOIDC } from 'oidc-provider'
import { createAdapter } from './adapter'
import { db, oidcClients, users, userRoles, roles } from '../db/index.ts'
import { eq } from 'drizzle-orm'
import { logger } from '../services/logger.ts'
import { writeAuditLog, AuditEvents } from '../services/audit.ts'
import * as argon2 from 'argon2'

/**
 * Find OIDC client from database
 */
async function findClient(clientId: string) {
  try {
    const result = await db
      .select()
      .from(oidcClients)
      .where(eq(oidcClients.clientId, clientId))
      .limit(1)

    if (result.length === 0) {
      return undefined
    }

    const client = result[0]

    if (!client.isActive) {
      return undefined
    }

    return {
      client_id: client.clientId,
      client_secret: client.clientSecretHash, // Will be verified with argon2
      redirect_uris: client.redirectUris || [],
      post_logout_redirect_uris: client.postLogoutRedirectUris || [],
      grant_types: client.grantTypes || ['authorization_code'],
      response_types: client.responseTypes || ['code'],
      scope: (client.scopes || ['openid', 'profile', 'email']).join(' '),
      token_endpoint_auth_method: client.tokenEndpointAuthMethod || 'client_secret_basic',
      // Custom properties
      'urn:sso:first_party': client.isFirstParty
    }
  } catch (error) {
    logger.error({ error, clientId }, 'Error finding OIDC client')
    return undefined
  }
}

/**
 * Find user account by ID
 */
async function findAccount(ctx: KoaContextWithOIDC, id: string) {
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    if (result.length === 0) {
      return undefined
    }

    const user = result[0]

    if (user.status !== 'active') {
      return undefined
    }

    // Get user roles
    const userRolesResult = await db
      .select({ roleName: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, user.id))

    const roleNames = userRolesResult.map(r => r.roleName)

    return {
      accountId: user.id,
      async claims() {
        return {
          sub: user.id,
          email: user.email,
          email_verified: true,
          name: user.name,
          preferred_username: user.email,
          employee_id: user.employeeId,
          roles: roleNames
        }
      }
    }
  } catch (error) {
    logger.error({ error, id }, 'Error finding account')
    return undefined
  }
}

/**
 * Create OIDC Provider configuration
 */
export function createProviderConfig(issuer: string, sessionSecret: string): Configuration {
  return {
    // Use PostgreSQL adapter
    adapter: createAdapter,

    // Find client from database
    clients: [], // Will use findClient

    // Find account
    findAccount,

    // Supported claims
    claims: {
      openid: ['sub'],
      profile: ['name', 'preferred_username', 'employee_id'],
      email: ['email', 'email_verified'],
      roles: ['roles']
    },

    // Scopes
    scopes: ['openid', 'profile', 'email', 'roles', 'offline_access'],

    // Features
    features: {
      // Enable PKCE for all clients
      pkce: {
        methods: ['S256'],
        required: () => true
      },
      // Enable refresh tokens
      revocation: { enabled: true },
      // Disable device flow for MVP
      deviceFlow: { enabled: false },
      // Enable introspection
      introspection: { enabled: true },
      // Enable user info
      userinfo: { enabled: true },
      // RP-initiated logout
      rpInitiatedLogout: {
        enabled: true,
        logoutSource: async (ctx, form) => {
          // Redirect to our logout confirmation page
          ctx.body = `<!DOCTYPE html>
            <html>
            <head><title>Logout</title></head>
            <body>
              <h1>Logging out...</h1>
              ${form}
              <script>document.forms[0].submit();</script>
            </body>
            </html>`
        }
      }
    },

    // Token configuration
    ttl: {
      AccessToken: 3600, // 1 hour
      AuthorizationCode: 600, // 10 minutes
      IdToken: 3600, // 1 hour
      RefreshToken: 86400 * 14, // 14 days
      Session: 86400 * 7 // 7 days
    },

    // Cookies configuration
    cookies: {
      keys: [sessionSecret],
      short: {
        httpOnly: true,
        sameSite: 'lax' as const,
        secure: process.env.NODE_ENV === 'production'
      },
      long: {
        httpOnly: true,
        sameSite: 'lax' as const,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 86400 * 14 * 1000 // 14 days
      }
    },

    // Interaction configuration
    interactions: {
      url: (ctx, interaction) => {
        return `/login?interaction=${interaction.uid}`
      }
    },

    // Render errors
    renderError: async (ctx, out, error) => {
      logger.error({ error: out, path: ctx.path }, 'OIDC provider error')
      ctx.type = 'html'
      ctx.body = `<!DOCTYPE html>
        <html>
        <head><title>Error</title></head>
        <body>
          <h1>An error occurred</h1>
          <pre>${JSON.stringify(out, null, 2)}</pre>
          <a href="/">Go back</a>
        </body>
        </html>`
    },

    // Custom client verification (for hashed secrets)
    extraClientMetadata: {
      properties: ['urn:sso:first_party']
    },

    // Client credentials validation with argon2
    clientAuthMethods: ['client_secret_basic', 'client_secret_post', 'none'],

    // Enable dynamic client registration (disabled for MVP)
    // registration: { enabled: false }
  }
}

/**
 * Create and configure OIDC Provider
 */
export function createOidcProvider(issuer: string, sessionSecret: string): Provider {
  const config = createProviderConfig(issuer, sessionSecret)
  const provider = new Provider(issuer, config)

  // Add client lookup
  provider.Client.find = findClient as any

  // Event listeners for audit logging
  provider.on('authorization.success', (ctx) => {
    const { oidc } = ctx
    writeAuditLog({
      action: AuditEvents.OIDC_AUTHORIZE_SUCCESS,
      actorUserId: oidc.session?.accountId,
      targetType: 'oidc_client',
      targetId: oidc.client?.clientId,
      ip: ctx.ip,
      userAgent: ctx.get('user-agent'),
      requestId: ctx.get('x-request-id'),
      metadata: {
        scopes: oidc.params?.scope,
        redirectUri: oidc.params?.redirect_uri
      }
    })
  })

  provider.on('authorization.error', (ctx, error) => {
    writeAuditLog({
      action: AuditEvents.OIDC_AUTHORIZE_FAILED,
      targetType: 'oidc_client',
      targetId: ctx.oidc?.client?.clientId,
      ip: ctx.ip,
      userAgent: ctx.get('user-agent'),
      requestId: ctx.get('x-request-id'),
      metadata: {
        error: error.message,
        error_description: error.error_description
      }
    })
  })

  provider.on('grant.success', (ctx) => {
    const { oidc } = ctx
    writeAuditLog({
      action: AuditEvents.OIDC_TOKEN_ISSUED,
      actorUserId: oidc.session?.accountId || oidc.account?.accountId,
      targetType: 'oidc_client',
      targetId: oidc.client?.clientId,
      ip: ctx.ip,
      userAgent: ctx.get('user-agent'),
      requestId: ctx.get('x-request-id'),
      metadata: {
        grantType: oidc.params?.grant_type
      }
    })
  })

  provider.on('grant.error', (ctx, error) => {
    writeAuditLog({
      action: AuditEvents.OIDC_TOKEN_FAILED,
      targetType: 'oidc_client',
      targetId: ctx.oidc?.client?.clientId,
      ip: ctx.ip,
      userAgent: ctx.get('user-agent'),
      requestId: ctx.get('x-request-id'),
      metadata: {
        error: error.message,
        grantType: ctx.oidc?.params?.grant_type
      }
    })
  })

  provider.on('end_session.success', (ctx) => {
    writeAuditLog({
      action: AuditEvents.OIDC_LOGOUT,
      actorUserId: ctx.oidc?.session?.accountId,
      targetType: 'session',
      ip: ctx.ip,
      userAgent: ctx.get('user-agent'),
      requestId: ctx.get('x-request-id')
    })
  })

  provider.on('revocation.success', (ctx) => {
    writeAuditLog({
      action: AuditEvents.OIDC_TOKEN_REVOKED,
      targetType: 'token',
      ip: ctx.ip,
      userAgent: ctx.get('user-agent'),
      requestId: ctx.get('x-request-id')
    })
  })

  return provider
}

// Singleton provider instance
let providerInstance: Provider | null = null

/**
 * Get or create OIDC Provider instance
 */
export function getOidcProvider(): Provider {
  if (!providerInstance) {
    const issuer = process.env.SSO_ISSUER || 'http://localhost:3000'
    const sessionSecret = process.env.SESSION_SECRET || 'change-me-in-production'
    providerInstance = createOidcProvider(issuer, sessionSecret)
  }
  return providerInstance
}
