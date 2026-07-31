import { computed } from 'vue'
import { useRuntimeConfig } from '#imports'

/**
 * Client helpers for SSO login button / status.
 */
export function useSso() {
  const config = useRuntimeConfig()

  const enabled = computed(() => !!config.public.ssoEnabled)
  const loginPath = computed(() => config.public.ssoLoginPath || '/api/auth/sso/login')

  function loginWithSso() {
    if (!import.meta.client) return
    window.location.href = loginPath.value
  }

  return {
    enabled,
    loginPath,
    loginWithSso,
  }
}
