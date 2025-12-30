/**
 * OIDC Service for handling OAuth 2.0 / OIDC flows
 */
import { db, oidcKv, users, oidcClients } from '../db/index.ts'
import { eq, and, gt } from 'drizzle-orm'
import { randomBytes } from 'crypto'
import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'change-me-to-a-secure-random-string-at-least-32-chars'
)

const ISSUER = process.env.SSO_ISSUER || 'http://localhost:3000'

interface AuthorizationCode {
  code: string
  clientId: string
  userId: string
  redirectUri: string
  scopes: string[]
  nonce?: string
  codeChallenge?: string
  codeChallengeMethod?: string
  expiresAt: number
}

interface TokenPayload {
  sub: string
  iss: string
  aud: string
  exp: number
  iat: number
  scope: string
  client_id: string
}

interface IDTokenPayload extends TokenPayload {
  nonce?: string
  email?: string
  name?: string
  employee_id?: string
  department?: string
  position?: string
  avatar_url?: string
  role_id?: string
  role_name?: string
}

/**
 * Generate random code
 */
export function generateCode(length: number = 32): string {
  return randomBytes(length).toString('base64url')
}

/**
 * Generate authorization code
 */
export async function createAuthorizationCode(params: {
  clientId: string
  userId: string
  redirectUri: string
  scopes: string[]
  nonce?: string
  codeChallenge?: string
  codeChallengeMethod?: string
}): Promise<string> {
  const code = generateCode(32)
  const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

  const authCode: AuthorizationCode = {
    code,
    clientId: params.clientId,
    userId: params.userId,
    redirectUri: params.redirectUri,
    scopes: params.scopes,
    nonce: params.nonce,
    codeChallenge: params.codeChallenge,
    codeChallengeMethod: params.codeChallengeMethod,
    expiresAt
  }

  // Store in oidc_kv table
  await db.insert(oidcKv).values({
    model: 'AuthorizationCode',
    key: code,
    payload: authCode as any,
    expiresAt: new Date(expiresAt)
  })

  return code
}

/**
 * Verify and consume authorization code
 */
export async function verifyAuthorizationCode(params: {
  code: string
  clientId: string
  redirectUri: string
  codeVerifier?: string
}): Promise<AuthorizationCode | null> {
  // Find authorization code
  const [entry] = await db
    .select()
    .from(oidcKv)
    .where(
      and(
        eq(oidcKv.model, 'AuthorizationCode'),
        eq(oidcKv.key, params.code),
        gt(oidcKv.expiresAt, new Date())
      )
    )
    .limit(1)

  if (!entry) {
    return null
  }

  const authCode = entry.payload as unknown as AuthorizationCode

  // Verify client_id
  if (authCode.clientId !== params.clientId) {
    return null
  }

  // Verify redirect_uri
  if (authCode.redirectUri !== params.redirectUri) {
    return null
  }

  // Verify PKCE if code_challenge was provided
  if (authCode.codeChallenge) {
    if (!params.codeVerifier) {
      return null
    }

    // Verify code_challenge matches code_verifier
    const crypto = await import('crypto')
    const hash = crypto.createHash('sha256')
      .update(params.codeVerifier)
      .digest('base64url')

    if (hash !== authCode.codeChallenge) {
      return null
    }
  }

  // Delete the code (one-time use)
  await db
    .delete(oidcKv)
    .where(eq(oidcKv.id, entry.id))

  return authCode
}

/**
 * Create access token JWT
 */
export async function createAccessToken(params: {
  userId: string
  clientId: string
  scopes: string[]
}): Promise<{ token: string; expiresIn: number }> {
  const expiresIn = 3600 // 1 hour
  const now = Math.floor(Date.now() / 1000)

  const payload: TokenPayload = {
    sub: params.userId,
    iss: ISSUER,
    aud: params.clientId,
    exp: now + expiresIn,
    iat: now,
    scope: params.scopes.join(' '),
    client_id: params.clientId
  }

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresIn)
    .sign(JWT_SECRET)

  return { token, expiresIn }
}

/**
 * Create ID token JWT
 */
export async function createIDToken(params: {
  userId: string
  clientId: string
  nonce?: string
}): Promise<{ token: string; expiresIn: number }> {
  const expiresIn = 3600 // 1 hour
  const now = Math.floor(Date.now() / 1000)

  // Fetch user data
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, params.userId))
    .limit(1)

  if (!user) {
    throw new Error('User not found')
  }

  const payload: IDTokenPayload = {
    sub: user.id,
    iss: ISSUER,
    aud: params.clientId,
    exp: now + expiresIn,
    iat: now,
    scope: 'openid profile email',
    client_id: params.clientId,
    email: user.email,
    name: user.name,
    employee_id: user.employeeId || undefined,
    department: user.department || undefined,
    position: user.position || undefined,
    avatar_url: user.avatarUrl || undefined,
    role_id: user.roleId || undefined,
    role_name: user.roleName || undefined
  }

  if (params.nonce) {
    payload.nonce = params.nonce
  }

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresIn)
    .sign(JWT_SECRET)

  return { token, expiresIn }
}

/**
 * Create refresh token
 */
export async function createRefreshToken(params: {
  userId: string
  clientId: string
  scopes: string[]
}): Promise<{ token: string; expiresIn: number }> {
  const token = generateCode(64)
  const expiresIn = 1209600 // 14 days
  const expiresAt = Date.now() + expiresIn * 1000

  // Store in oidc_kv table
  await db.insert(oidcKv).values({
    model: 'RefreshToken',
    key: token,
    payload: {
      userId: params.userId,
      clientId: params.clientId,
      scopes: params.scopes
    } as any,
    expiresAt: new Date(expiresAt)
  })

  return { token, expiresIn }
}

/**
 * Verify and rotate refresh token
 */
export async function verifyRefreshToken(params: {
  token: string
  clientId: string
}): Promise<{ userId: string; scopes: string[] } | null> {
  const [entry] = await db
    .select()
    .from(oidcKv)
    .where(
      and(
        eq(oidcKv.model, 'RefreshToken'),
        eq(oidcKv.key, params.token),
        gt(oidcKv.expiresAt, new Date())
      )
    )
    .limit(1)

  if (!entry) {
    return null
  }

  const payload = entry.payload as any

  // Verify client_id
  if (payload.clientId !== params.clientId) {
    return null
  }

  // Delete old refresh token (rotation)
  await db.delete(oidcKv).where(eq(oidcKv.id, entry.id))

  return {
    userId: payload.userId,
    scopes: payload.scopes
  }
}

/**
 * Verify access token
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as TokenPayload
  } catch {
    return null
  }
}

/**
 * Get user info from token
 */
export async function getUserInfo(userId: string) {
  const [user] = await db
    .select({
      sub: users.id,
      email: users.email,
      name: users.name,
      employee_id: users.employeeId,
      department: users.department,
      position: users.position,
      avatar_url: users.avatarUrl,
      role_id: users.roleId,
      role_name: users.roleName
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return user
}
