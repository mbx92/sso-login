# Integrasi SSO OIDC dengan Nuxt 4 (JWT-Based)

Panduan lengkap untuk mengintegrasikan aplikasi Nuxt 4 dengan SSO Identity Provider menggunakan OpenID Connect (OIDC) dengan JWT-based authentication.

## Daftar Isi
- [Prasyarat](#prasyarat)
- [Instalasi Package](#instalasi-package)
- [Registrasi Client di SSO](#registrasi-client-di-sso)
- [Konfigurasi Nuxt](#konfigurasi-nuxt)
- [Implementasi Auth Module](#implementasi-auth-module)
- [Composables](#composables)
- [Middleware](#middleware)
- [API Integration](#api-integration)
- [Protected Routes](#protected-routes)
- [Logout](#logout)
- [Troubleshooting](#troubleshooting)

---

## Prasyarat

- Nuxt 4.x
- Node.js 18+
- Aplikasi Nuxt sudah berjalan
- Akses ke SSO Admin Dashboard
- SSL/TLS Certificate (untuk production)

---

## Instalasi Package

### 1. Install Dependencies

```bash
npm install @pinia/nuxt pinia
npm install jose # untuk JWT verification
npm install ofetch # HTTP client (biasanya sudah include di Nuxt)
```

### 2. Update `nuxt.config.ts`

```typescript
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
  ],

  runtimeConfig: {
    // Private keys (server-side only)
    sso: {
      clientSecret: process.env.SSO_CLIENT_SECRET,
    },

    // Public keys (available on client-side)
    public: {
      sso: {
        baseUrl: process.env.SSO_BASE_URL || 'https://sso.yourdomain.com',
        clientId: process.env.SSO_CLIENT_ID || '',
        redirectUri: process.env.SSO_REDIRECT_URI || 'http://localhost:3000/auth/callback',
        scopes: ['openid', 'profile', 'email'],
      },
    },
  },

  // Optional: Enable auto-imports
  imports: {
    dirs: ['stores'],
  },
})
```

---

## Registrasi Client di SSO

### 1. Login ke SSO Admin Dashboard

Buka: `https://sso.yourdomain.com/admin/clients`

### 2. Buat Client Baru

Klik "Add Client" dan isi form:

- **Client Name:** `Nuxt App - [Nama Aplikasi Anda]`
- **Client ID:** `nuxt-app-prod` (catat ini!)
- **Client Secret:** (akan di-generate otomatis - catat ini!)
- **Redirect URIs:** 
  ```
  https://yourapp.com/auth/callback
  http://localhost:3000/auth/callback (untuk development)
  ```
- **Grant Types:** `authorization_code`, `refresh_token`
- **Scopes:** `openid`, `profile`, `email`
- **PKCE Required:** ✅ Yes (recommended untuk SPA)

### 3. Catat Credentials

Setelah client dibuat, catat:
- Client ID
- Client Secret (optional untuk PKCE)
- Redirect URI

---

## Konfigurasi Nuxt

### 1. Update `.env`

```env
# SSO OIDC Configuration
SSO_BASE_URL=https://sso.yourdomain.com
SSO_CLIENT_ID=nuxt-app-prod
SSO_CLIENT_SECRET=your-secret-from-sso-admin
SSO_REDIRECT_URI=http://localhost:3000/auth/callback

# For production
# SSO_BASE_URL=https://sso.yourdomain.com
# SSO_REDIRECT_URI=https://yourapp.com/auth/callback
```

### 2. Buat Types

`types/auth.ts`:

```typescript
export interface User {
  id: string
  email: string
  name: string
  employeeId?: string
  department?: string
  position?: string
  avatarUrl?: string
  roleId?: string
  roleName?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  idToken: string
  expiresAt: number
}

export interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
}
```

---

## Implementasi Auth Module

### 1. Buat Auth Store (Pinia)

`stores/auth.ts`:

```typescript
import { defineStore } from 'pinia'
import type { User, AuthTokens, AuthState } from '~/types/auth'

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: false,
  }),

  getters: {
    isTokenExpired: (state) => {
      if (!state.tokens) return true
      return Date.now() >= state.tokens.expiresAt
    },

    shouldRefreshToken: (state) => {
      if (!state.tokens) return false
      // Refresh 5 minutes before expiry
      return Date.now() >= state.tokens.expiresAt - 5 * 60 * 1000
    },
  },

  actions: {
    /**
     * Set authentication data
     */
    setAuth(user: User, tokens: AuthTokens) {
      this.user = user
      this.tokens = tokens
      this.isAuthenticated = true

      // Save to localStorage for persistence
      if (process.client) {
        localStorage.setItem('auth_user', JSON.stringify(user))
        localStorage.setItem('auth_tokens', JSON.stringify(tokens))
      }
    },

    /**
     * Clear authentication data
     */
    clearAuth() {
      this.user = null
      this.tokens = null
      this.isAuthenticated = false

      if (process.client) {
        localStorage.removeItem('auth_user')
        localStorage.removeItem('auth_tokens')
      }
    },

    /**
     * Restore auth from localStorage
     */
    restoreAuth() {
      if (!process.client) return

      try {
        const userStr = localStorage.getItem('auth_user')
        const tokensStr = localStorage.getItem('auth_tokens')

        if (userStr && tokensStr) {
          this.user = JSON.parse(userStr)
          this.tokens = JSON.parse(tokensStr)
          this.isAuthenticated = true

          // Check if token is expired
          if (this.isTokenExpired) {
            this.clearAuth()
          }
        }
      } catch (error) {
        console.error('Failed to restore auth:', error)
        this.clearAuth()
      }
    },

    /**
     * Update user data
     */
    updateUser(user: Partial<User>) {
      if (this.user) {
        this.user = { ...this.user, ...user }
        if (process.client) {
          localStorage.setItem('auth_user', JSON.stringify(this.user))
        }
      }
    },

    /**
     * Update tokens
     */
    updateTokens(tokens: AuthTokens) {
      this.tokens = tokens
      if (process.client) {
        localStorage.setItem('auth_tokens', JSON.stringify(tokens))
      }
    },
  },
})
```

### 2. Buat Auth Utils

`utils/pkce.ts`:

```typescript
/**
 * Generate PKCE code verifier and challenge
 */
export function generatePKCE() {
  // Generate random code verifier (43-128 characters)
  const codeVerifier = generateRandomString(128)
  
  // Generate code challenge (SHA-256 hash of verifier)
  const codeChallenge = base64UrlEncode(sha256(codeVerifier))

  return {
    codeVerifier,
    codeChallenge,
  }
}

function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  let result = ''
  const values = new Uint8Array(length)
  crypto.getRandomValues(values)
  
  for (let i = 0; i < length; i++) {
    result += charset[values[i] % charset.length]
  }
  
  return result
}

function sha256(plain: string): ArrayBuffer {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return crypto.subtle.digest('SHA-256', data)
}

function base64UrlEncode(arrayBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(arrayBuffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}
```

`utils/auth.ts`:

```typescript
/**
 * Build authorization URL for OIDC flow
 */
export function buildAuthUrl(config: {
  baseUrl: string
  clientId: string
  redirectUri: string
  scopes: string[]
  state: string
  nonce: string
  codeChallenge?: string
}): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state: config.state,
    nonce: config.nonce,
  })

  // Add PKCE challenge if provided
  if (config.codeChallenge) {
    params.append('code_challenge', config.codeChallenge)
    params.append('code_challenge_method', 'S256')
  }

  return `${config.baseUrl}/api/oidc/authorize?${params.toString()}`
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(config: {
  baseUrl: string
  clientId: string
  clientSecret?: string
  redirectUri: string
  code: string
  codeVerifier?: string
}): Promise<any> {
  const body: Record<string, string> = {
    grant_type: 'authorization_code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    code: config.code,
  }

  // Add client secret if not using PKCE
  if (config.clientSecret) {
    body.client_secret = config.clientSecret
  }

  // Add PKCE verifier
  if (config.codeVerifier) {
    body.code_verifier = config.codeVerifier
  }

  const response = await $fetch(`${config.baseUrl}/api/oidc/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body),
  })

  return response
}

/**
 * Fetch user info from SSO
 */
export async function fetchUserInfo(baseUrl: string, accessToken: string): Promise<any> {
  return await $fetch(`${baseUrl}/api/oidc/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(config: {
  baseUrl: string
  clientId: string
  clientSecret?: string
  refreshToken: string
}): Promise<any> {
  const body: Record<string, string> = {
    grant_type: 'refresh_token',
    client_id: config.clientId,
    refresh_token: config.refreshToken,
  }

  if (config.clientSecret) {
    body.client_secret = config.clientSecret
  }

  const response = await $fetch(`${config.baseUrl}/api/oidc/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body),
  })

  return response
}
```

---

## Composables

### 1. Auth Composable

`composables/useAuth.ts`:

```typescript
import { useAuthStore } from '~/stores/auth'
import type { User, AuthTokens } from '~/types/auth'

export const useAuth = () => {
  const authStore = useAuthStore()
  const config = useRuntimeConfig()
  const router = useRouter()

  /**
   * Login - Redirect to SSO
   */
  const login = async (returnUrl?: string) => {
    if (!process.client) return

    // Generate PKCE challenge
    const { codeVerifier, codeChallenge } = generatePKCE()
    
    // Generate state and nonce
    const state = generateRandomString(32)
    const nonce = generateRandomString(32)

    // Store PKCE and state in sessionStorage
    sessionStorage.setItem('pkce_code_verifier', codeVerifier)
    sessionStorage.setItem('oauth_state', state)
    sessionStorage.setItem('oauth_nonce', nonce)
    if (returnUrl) {
      sessionStorage.setItem('return_url', returnUrl)
    }

    // Build authorization URL
    const authUrl = buildAuthUrl({
      baseUrl: config.public.sso.baseUrl,
      clientId: config.public.sso.clientId,
      redirectUri: config.public.sso.redirectUri,
      scopes: config.public.sso.scopes,
      state,
      nonce,
      codeChallenge,
    })

    // Redirect to SSO
    window.location.href = authUrl
  }

  /**
   * Handle OAuth callback
   */
  const handleCallback = async (code: string, state: string) => {
    if (!process.client) return

    // Verify state
    const savedState = sessionStorage.getItem('oauth_state')
    if (state !== savedState) {
      throw new Error('Invalid state parameter')
    }

    // Get PKCE verifier
    const codeVerifier = sessionStorage.getItem('pkce_code_verifier')

    try {
      // Exchange code for tokens
      const tokenResponse = await exchangeCodeForTokens({
        baseUrl: config.public.sso.baseUrl,
        clientId: config.public.sso.clientId,
        redirectUri: config.public.sso.redirectUri,
        code,
        codeVerifier: codeVerifier || undefined,
      })

      // Fetch user info
      const userInfo = await fetchUserInfo(
        config.public.sso.baseUrl,
        tokenResponse.access_token
      )

      // Prepare auth data
      const user: User = {
        id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        employeeId: userInfo.employee_id,
        department: userInfo.department,
        position: userInfo.position,
        avatarUrl: userInfo.avatar_url,
        roleId: userInfo.role_id,
        roleName: userInfo.role_name,
      }

      const tokens: AuthTokens = {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        idToken: tokenResponse.id_token,
        expiresAt: Date.now() + tokenResponse.expires_in * 1000,
      }

      // Save to store
      authStore.setAuth(user, tokens)

      // Clean up session storage
      sessionStorage.removeItem('pkce_code_verifier')
      sessionStorage.removeItem('oauth_state')
      sessionStorage.removeItem('oauth_nonce')

      // Redirect to return URL or home
      const returnUrl = sessionStorage.getItem('return_url') || '/'
      sessionStorage.removeItem('return_url')
      
      await router.push(returnUrl)
    } catch (error) {
      console.error('OAuth callback error:', error)
      throw error
    }
  }

  /**
   * Logout
   */
  const logout = async () => {
    const idToken = authStore.tokens?.idToken

    // Clear local auth
    authStore.clearAuth()

    // Redirect to SSO logout if we have id_token
    if (idToken && process.client) {
      const logoutUrl = new URL(`${config.public.sso.baseUrl}/api/oidc/logout`)
      logoutUrl.searchParams.set('id_token_hint', idToken)
      logoutUrl.searchParams.set('post_logout_redirect_uri', window.location.origin)
      
      window.location.href = logoutUrl.toString()
    } else {
      await router.push('/login')
    }
  }

  /**
   * Refresh token
   */
  const refresh = async () => {
    if (!authStore.tokens?.refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const tokenResponse = await refreshAccessToken({
        baseUrl: config.public.sso.baseUrl,
        clientId: config.public.sso.clientId,
        refreshToken: authStore.tokens.refreshToken,
      })

      const tokens: AuthTokens = {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || authStore.tokens.refreshToken,
        idToken: tokenResponse.id_token || authStore.tokens.idToken,
        expiresAt: Date.now() + tokenResponse.expires_in * 1000,
      }

      authStore.updateTokens(tokens)
    } catch (error) {
      console.error('Token refresh failed:', error)
      // If refresh fails, logout
      await logout()
      throw error
    }
  }

  /**
   * Auto-refresh token if needed
   */
  const ensureValidToken = async () => {
    if (authStore.shouldRefreshToken) {
      await refresh()
    }
  }

  return {
    user: computed(() => authStore.user),
    isAuthenticated: computed(() => authStore.isAuthenticated),
    isLoading: computed(() => authStore.isLoading),
    login,
    logout,
    handleCallback,
    refresh,
    ensureValidToken,
  }
}

function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const values = new Uint8Array(length)
  crypto.getRandomValues(values)
  
  for (let i = 0; i < length; i++) {
    result += charset[values[i] % charset.length]
  }
  
  return result
}
```

---

## Middleware

### 1. Auth Middleware

`middleware/auth.global.ts`:

```typescript
export default defineNuxtRouteMiddleware(async (to) => {
  // Skip middleware on server-side
  if (process.server) return

  const authStore = useAuthStore()
  const { ensureValidToken } = useAuth()

  // Restore auth from localStorage on first load
  if (!authStore.isAuthenticated && !authStore.user) {
    authStore.restoreAuth()
  }

  // Public routes that don't require auth
  const publicRoutes = ['/login', '/auth/callback', '/']
  const isPublicRoute = publicRoutes.some(route => to.path.startsWith(route))

  if (!isPublicRoute) {
    // Protected route - require authentication
    if (!authStore.isAuthenticated) {
      return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }

    // Ensure token is valid (auto-refresh if needed)
    try {
      await ensureValidToken()
    } catch (error) {
      console.error('Token validation failed:', error)
      return navigateTo('/login')
    }
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    // Already authenticated, redirect to home
    return navigateTo('/')
  }
})
```

---

## API Integration

### 1. API Plugin dengan Auto JWT Injection

`plugins/api.ts`:

```typescript
export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  const { refresh } = useAuth()

  const api = $fetch.create({
    baseURL: '/api', // Your API base URL
    
    async onRequest({ options }) {
      // Add Authorization header with JWT
      const token = authStore.tokens?.accessToken
      if (token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        }
      }
    },

    async onResponseError({ response }) {
      // Auto-refresh on 401
      if (response.status === 401) {
        try {
          await refresh()
          // Retry the request with new token
          // (Note: you might want to implement retry logic here)
        } catch (error) {
          console.error('Auto-refresh failed:', error)
        }
      }
    },
  })

  return {
    provide: {
      api,
    },
  }
})
```

### 2. Usage dalam Components

```typescript
<script setup lang="ts">
const { $api } = useNuxtApp()

const { data, error } = await useAsyncData('users', () =>
  $api('/users')
)
</script>
```

---

## Protected Routes

### 1. Login Page

`pages/login.vue`:

```vue
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Welcome</h1>
        <p class="text-gray-600 mt-2">Login menggunakan akun SSO perusahaan</p>
      </div>

      <button
        @click="handleLogin"
        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
      >
        <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
        Login dengan SSO
      </button>

      <p class="text-center text-sm text-gray-500 mt-6">
        Anda akan diarahkan ke halaman login SSO
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const { login } = useAuth()
const route = useRoute()

const handleLogin = async () => {
  const redirect = route.query.redirect as string
  await login(redirect)
}
</script>
```

### 2. Callback Page

`pages/auth/callback.vue`:

```vue
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="text-center">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p class="mt-4 text-gray-600">{{ message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { handleCallback } = useAuth()
const message = ref('Memproses login...')

onMounted(async () => {
  const code = route.query.code as string
  const state = route.query.state as string
  const error = route.query.error as string

  if (error) {
    message.value = 'Login gagal: ' + (route.query.error_description || error)
    setTimeout(() => {
      navigateTo('/login')
    }, 3000)
    return
  }

  if (!code || !state) {
    message.value = 'Invalid callback parameters'
    setTimeout(() => {
      navigateTo('/login')
    }, 2000)
    return
  }

  try {
    await handleCallback(code, state)
    message.value = 'Login berhasil! Redirecting...'
  } catch (err: any) {
    console.error('Callback error:', err)
    message.value = 'Login gagal: ' + err.message
    setTimeout(() => {
      navigateTo('/login')
    }, 3000)
  }
})
</script>
```

### 3. Dashboard (Protected)

`pages/dashboard.vue`:

```vue
<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Navbar -->
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-bold">Dashboard</h1>
          </div>

          <div class="flex items-center gap-4">
            <!-- User Info -->
            <div class="flex items-center gap-3">
              <img
                v-if="user?.avatarUrl"
                :src="user.avatarUrl"
                :alt="user.name"
                class="w-10 h-10 rounded-full"
              />
              <div v-else class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                {{ user?.name?.charAt(0).toUpperCase() }}
              </div>
              <div>
                <p class="text-sm font-semibold">{{ user?.name }}</p>
                <p class="text-xs text-gray-500">{{ user?.department }}</p>
              </div>
            </div>

            <!-- Logout Button -->
            <button
              @click="handleLogout"
              class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Content -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- User Info Card -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold mb-4">Profile Information</h2>
          <dl class="space-y-2">
            <div>
              <dt class="text-sm text-gray-500">Name</dt>
              <dd class="text-sm font-medium">{{ user?.name }}</dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500">Email</dt>
              <dd class="text-sm font-medium">{{ user?.email }}</dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500">Employee ID</dt>
              <dd class="text-sm font-medium">{{ user?.employeeId || '-' }}</dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500">Department</dt>
              <dd class="text-sm font-medium">{{ user?.department || '-' }}</dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500">Position</dt>
              <dd class="text-sm font-medium">{{ user?.position || '-' }}</dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500">Role</dt>
              <dd class="text-sm font-medium">{{ user?.roleName || '-' }}</dd>
            </div>
          </dl>
        </div>

        <!-- More cards... -->
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const { user, logout } = useAuth()

const handleLogout = async () => {
  if (confirm('Are you sure you want to logout?')) {
    await logout()
  }
}
</script>
```

---

## Plugin untuk Auto-Init

`plugins/auth-init.client.ts`:

```typescript
export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()

  // Restore auth on app init
  authStore.restoreAuth()
})
```

---

## Troubleshooting

### 1. Token Expired Loop

**Problem:** User terus-menerus di-logout

**Solusi:**
```typescript
// Pastikan expiresAt dihitung dengan benar
expiresAt: Date.now() + tokenResponse.expires_in * 1000

// Bukan:
expiresAt: tokenResponse.expires_in // WRONG!
```

### 2. PKCE Verification Failed

**Problem:** `invalid_grant: Invalid code_verifier`

**Solusi:**
- Pastikan `code_verifier` disimpan di sessionStorage
- Jangan gunakan localStorage (tidak aman untuk PKCE)
- Verify SHA-256 hashing implementation

### 3. CORS Issues

**Problem:** `Access-Control-Allow-Origin` error

**Solusi:**
- SSO server harus allow origin dari Nuxt app
- Development: `http://localhost:3000`
- Production: `https://yourapp.com`

### 4. State Mismatch

**Problem:** `Invalid state parameter`

**Solusi:**
- Clear browser cache/cookies
- Check sessionStorage implementation
- Verify state tidak expired

### 5. Hydration Mismatch

**Problem:** Nuxt hydration errors

**Solusi:**
```typescript
// Use client-only plugin
// plugins/auth-init.client.ts

// Or wrap in ClientOnly component
<ClientOnly>
  <UserMenu />
</ClientOnly>
```

---

## Best Practices

### 1. Security

✅ **PKCE untuk Public Clients**
```typescript
// Always use PKCE for SPA/mobile apps
const { codeVerifier, codeChallenge } = generatePKCE()
```

✅ **Secure Token Storage**
```typescript
// Use httpOnly cookies for refresh tokens (server-side)
// Use memory/sessionStorage for access tokens (client-side)
```

✅ **Auto Token Refresh**
```typescript
// Refresh 5 minutes before expiry
if (Date.now() >= expiresAt - 5 * 60 * 1000) {
  await refresh()
}
```

### 2. Performance

✅ **Lazy Load Auth Pages**
```typescript
// Don't load auth logic on public pages
const authStore = process.client ? useAuthStore() : null
```

✅ **Cache User Info**
```typescript
// Persist user to localStorage
localStorage.setItem('auth_user', JSON.stringify(user))
```

### 3. User Experience

✅ **Loading States**
```vue
<div v-if="isLoading">Loading...</div>
```

✅ **Error Handling**
```typescript
try {
  await login()
} catch (error) {
  showNotification('Login failed: ' + error.message)
}
```

✅ **Return URL**
```typescript
// Save intended URL before redirect
sessionStorage.setItem('return_url', to.fullPath)
```

---

## Testing

### Development Testing

```bash
# Start Nuxt dev server
npm run dev

# Open browser
http://localhost:3000

# Test flow:
1. Click "Login dengan SSO"
2. Redirected to SSO login
3. Login with: employee@email.com / Welcome123!
4. Redirected back to /auth/callback
5. Should see dashboard with user info
6. Click "Logout"
7. Should logout and redirect to login page
```

### Manual Checklist

- [ ] Login redirect ke SSO berfungsi
- [ ] PKCE challenge generated
- [ ] Callback menerima code & state
- [ ] Token exchange berhasil
- [ ] User info fetched dari SSO
- [ ] User tersimpan di Pinia store
- [ ] Token tersimpan di localStorage
- [ ] Protected routes require auth
- [ ] Auto-refresh token berfungsi
- [ ] Logout menghapus tokens
- [ ] SSO logout redirect berfungsi

---

## Deployment Production

### 1. Environment Variables

```bash
# Production .env
SSO_BASE_URL=https://sso.yourdomain.com
SSO_CLIENT_ID=nuxt-app-prod
SSO_CLIENT_SECRET=production-secret-here
SSO_REDIRECT_URI=https://yourapp.com/auth/callback
```

### 2. Build & Deploy

```bash
# Build for production
npm run build

# Preview locally
npm run preview

# Deploy to your hosting
# (Vercel, Netlify, custom server, etc.)
```

### 3. SSL Certificate

- Gunakan valid SSL certificate
- HTTPS mandatory untuk production
- Update SSO redirect URI ke HTTPS

### 4. Security Headers

Add to `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  routeRules: {
    '/**': {
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      },
    },
  },
})
```

---

## Advanced: API Backend Integration

Jika Nuxt app perlu call API backend dengan JWT:

```typescript
// server/api/example.get.ts
export default defineEventHandler(async (event) => {
  // Get JWT from Authorization header
  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  // Verify JWT with SSO public key
  // (implement JWT verification here)

  // Make authenticated request to your backend
  const response = await $fetch('https://api.yourbackend.com/data', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return response
})
```

---

## Support

Untuk pertanyaan atau issues:
1. Check SSO Admin Dashboard → Audit Logs
2. Check browser console untuk errors
3. Verify client configuration di SSO Admin
4. Contact SSO Administrator

---

**Created:** December 2025  
**Version:** 1.0.0  
**Compatible with:** Nuxt 4.x, SSO IdP v1.0
