/**
 * Cookie utility functions
 */

/**
 * Determine if cookies should be secure based on environment.
 * 
 * Uses COOKIE_SECURE env var if set, otherwise falls back to NODE_ENV check.
 * This allows running production mode without HTTPS in development/testing.
 * 
 * Set COOKIE_SECURE=false in docker.env when using HTTP
 * Set COOKIE_SECURE=true in production with HTTPS
 */
export function shouldUseSecureCookies(): boolean {
  // If COOKIE_SECURE is explicitly set, use that value
  const cookieSecureEnv = process.env.COOKIE_SECURE
  if (cookieSecureEnv !== undefined && cookieSecureEnv !== '') {
    return cookieSecureEnv.toLowerCase() === 'true'
  }
  
  // Fall back to NODE_ENV check for backwards compatibility
  return process.env.NODE_ENV === 'production'
}
