import { db, users } from '../../db/index'
import { eq } from 'drizzle-orm'
import * as argon2 from 'argon2'
import { v4 as uuidv4 } from 'uuid'
import { writeAuditLog, AuditEvents } from '../../services/audit'
import { serialize } from 'cookie'

interface LoginBody {
  email: string
  password: string
}

/**
 * Read request body manually to avoid h3 version conflicts
 */
async function parseBody(event: any): Promise<LoginBody | null> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = []
    event.node.req.on('data', (chunk: Buffer) => chunks.push(chunk))
    event.node.req.on('end', () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString())
        resolve(body)
      } catch {
        resolve(null)
      }
    })
    event.node.req.on('error', () => resolve(null))
  })
}

/**
 * Set cookie using native Node.js response
 */
function setNativeCookie(event: any, name: string, value: string, options: {
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'lax' | 'strict' | 'none'
  maxAge?: number
  path?: string
}) {
  const cookieString = serialize(name, value, {
    httpOnly: options.httpOnly ?? true,
    secure: options.secure ?? false,
    sameSite: options.sameSite ?? 'lax',
    maxAge: options.maxAge,
    path: options.path ?? '/'
  })
  
  console.log('Setting cookie:', name, '=', cookieString.substring(0, 100) + '...')
  
  // Append to existing Set-Cookie headers
  const existingCookies = event.node.res.getHeader('Set-Cookie') || []
  const cookies = Array.isArray(existingCookies) ? existingCookies : [existingCookies]
  cookies.push(cookieString)
  event.node.res.setHeader('Set-Cookie', cookies)
  
  console.log('Total cookies set:', cookies.length)
}

/**
 * Login endpoint for admin users
 * POST /api/auth/login
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await parseBody(event)
    
    if (!body) {
      throw createError({
        statusCode: 400,
        message: 'Request body is required'
      })
    }

    const { email, password } = body

    // Validate input
    if (!email || !password) {
      throw createError({
        statusCode: 400,
        message: 'Email and password are required'
      })
    }

    // Find user by email
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    const user = userResult[0]

    if (!user || !user.passwordHash) {
      throw createError({
        statusCode: 401,
        message: 'Invalid email or password'
      })
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw createError({
        statusCode: 403,
        message: 'Account is not active'
      })
    }

    // Verify password
    const isPasswordValid = await argon2.verify(user.passwordHash, password)

    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        message: 'Invalid email or password'
      })
    }

    // Create session
    const sessionId = uuidv4()
    const sessionData = {
      userId: user.id,
      email: user.email,
      employeeId: user.employeeId,
      name: user.name
    }

    // Set session cookie (7 days) using native method
    setNativeCookie(event, 'sso_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    })

    // Store session data in cookie (not httpOnly so client can read it)
    setNativeCookie(event, 'sso_user', JSON.stringify(sessionData), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    })

    // Log successful login (don't await to not block response)
    const forwardedFor = event.node?.req.headers['x-forwarded-for']
    const clientIp = (typeof forwardedFor === 'string' 
      ? forwardedFor.split(',')[0]?.trim() 
      : null) || event.node?.req.socket.remoteAddress || 'unknown'
    
    writeAuditLog({
      action: AuditEvents.AUTH_LOGIN_SUCCESS,
      actorUserId: user.id,
      actorType: 'user',
      targetType: 'user',
      targetId: user.id,
      ip: clientIp,
      userAgent: (event.node?.req.headers['user-agent'] as string) || 'unknown',
      requestId: event.context?.requestId,
      metadata: { 
        sessionId,
        email: user.email,
        name: user.name
      }
    }).catch(console.error)

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        employeeId: user.employeeId,
        name: user.name,
        status: user.status
      }
    }
  } catch (error) {
    console.error('Login error:', (error as Error).message)
    
    if ((error as any).statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: 'An error occurred during login'
    })
  }
})
