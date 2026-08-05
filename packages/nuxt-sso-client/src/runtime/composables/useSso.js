import { computed, ref } from 'vue'
import { useRuntimeConfig } from '#imports'

/**
 * Client helpers for SSO login button / status.
 */
export function useSso() {
  const config = useRuntimeConfig()

  const enabled = computed(() => !!config.public.ssoEnabled)
  const loginPath = computed(() => config.public.ssoLoginPath || '/api/auth/sso/login')
  const logoutPath = computed(() => config.public.ssoLogoutPath || '/api/auth/sso/logout')

  const sessionChecked = ref(false)
  const sessionValid = ref(true)

  function loginWithSso() {
    if (!import.meta.client) return
    window.location.href = loginPath.value
  }

  /**
   * Full navigation to the package's logout route, which clears the SSO
   * session cookie here and forwards to the issuer to end the session
   * there too. Host apps should call this instead of just clearing their
   * own local session, or the issuer session stays alive and the user
   * gets silently re-logged-in on the next visit.
   */
  function logoutFromSso() {
    if (!import.meta.client) return
    window.location.href = logoutPath.value
  }

  /**
   * Verify that the SSO session on the issuer is still valid. The package
   * tracks the SSO account id server-side (its own session cookie, set
   * during callback) — nothing to pass in from the host app.
   *
   * @returns {Promise<boolean>} true if session is still valid
   */
  async function checkSession() {
    try {
      const { $fetch } = await import('ofetch')
      const result = await $fetch('/api/auth/sso/check-session', {
        credentials: 'include',
      })
      sessionValid.value = result?.valid === true
    }
    catch {
      sessionValid.value = false
    }

    sessionChecked.value = true
    return sessionValid.value
  }

  /**
   * Redirect to login page with session expired reason.
   * Call this when checkSession() returns false.
   */
  function redirectToLogin(reason = 'session_expired') {
    if (!import.meta.client) return
    window.location.href = `/login?reason=${reason}`
  }

  return {
    enabled,
    loginPath,
    logoutPath,
    loginWithSso,
    logoutFromSso,
    checkSession,
    redirectToLogin,
    sessionChecked,
    sessionValid,
  }
}
