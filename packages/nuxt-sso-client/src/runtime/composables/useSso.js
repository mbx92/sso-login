import { computed, ref } from 'vue'
import { useRuntimeConfig } from '#imports'

/**
 * Client helpers for SSO login button / status.
 */
export function useSso() {
  const config = useRuntimeConfig()

  const enabled = computed(() => !!config.public.ssoEnabled)
  const loginPath = computed(() => config.public.ssoLoginPath || '/api/auth/sso/login')

  const sessionChecked = ref(false)
  const sessionValid = ref(true)

  function loginWithSso() {
    if (!import.meta.client) return
    window.location.href = loginPath.value
  }

  /**
   * Verify that the SSO session on the issuer is still valid.
   * Host app must store `access_token` (from resolve-user callback)
   * and pass it here.
   *
   * @param {string} accessToken - the access_token from SSO callback
   * @returns {Promise<boolean>} true if session is still valid
   */
  async function checkSession(accessToken) {
    if (!accessToken) {
      sessionValid.value = false
      sessionChecked.value = true
      return false
    }

    try {
      const { $fetch } = await import('ofetch')
      const result = await $fetch('/api/auth/sso/check-session', {
        method: 'POST',
        body: { access_token: accessToken },
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
    loginWithSso,
    checkSession,
    redirectToLogin,
    sessionChecked,
    sessionValid,
  }
}
