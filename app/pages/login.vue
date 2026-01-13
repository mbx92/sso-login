<template>
  <div class="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
    <!-- Background Pattern -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/50 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200/50 rounded-full blur-3xl"></div>
    </div>

    <div class="w-full max-w-md relative z-10">
      <!-- Card -->
      <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <!-- Logo / Title -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 mb-4">
            <svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900">SSO Login</h1>
          <p class="text-gray-500 mt-2">Identity Provider Portal</p>
        </div>

        <!-- Error Alert -->
        <div v-if="errorMsg" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <svg class="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <p class="text-sm text-red-700">{{ errorMsg }}</p>
          </div>
          <button @click="errorMsg = ''" class="text-red-400 hover:text-red-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Success Alert -->
        <div v-if="successMsg" class="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
          <svg class="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm text-emerald-700">{{ successMsg }}</p>
        </div>

        <!-- Login Form -->
        <form class="space-y-5" @submit.prevent="doLogin">
          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                v-model="email"
                type="email"
                placeholder="admin@example.com"
                autocomplete="email"
                class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <!-- Password -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                v-model="password"
                type="password"
                placeholder="••••••••"
                autocomplete="current-password"
                class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg v-if="isLoading" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ isLoading ? 'Signing in...' : 'Sign In' }}</span>
          </button>

          <!-- Fill Test Credentials (Dev only) -->
          <button
            v-if="isDev"
            type="button"
            @click="fillTest"
            class="w-full py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Fill Test Credentials</span>
          </button>
        </form>

        <!-- Divider -->
        <div class="my-6 flex items-center">
          <div class="flex-1 border-t border-gray-200"></div>
        </div>

        <!-- Footer -->
        <p class="text-center text-sm text-gray-500">
          Need help? Contact
          <a href="mailto:it-support@company.com" class="text-emerald-600 font-medium hover:underline">
            IT Support
          </a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const route = useRoute()

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const isDev = process.env.NODE_ENV !== 'production'

// OIDC parameters from query string
const clientId = computed(() => route.query.client_id as string)
const redirectUri = computed(() => route.query.redirect_uri as string)
const state = computed(() => route.query.state as string)
const scope = computed(() => route.query.scope as string)
const nonce = computed(() => route.query.nonce as string)
const codeChallenge = computed(() => route.query.code_challenge as string)
const codeChallengeMethod = computed(() => route.query.code_challenge_method as string)

// Check if this is an OIDC login flow
const isOIDCFlow = computed(() => !!clientId.value && !!redirectUri.value && !!state.value)

function fillTest() {
  email.value = 'admin@example.com'
  password.value = 'change-me-immediately'
  errorMsg.value = ''
  successMsg.value = ''
}

async function doLogin() {
  console.log('doLogin called')
  errorMsg.value = ''
  successMsg.value = ''

  if (!email.value || !password.value) {
    errorMsg.value = 'Please enter email and password'
    return
  }

  isLoading.value = true
  console.log('Attempting login with:', email.value)

  try {
    const res = await $fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      body: {
        email: email.value,
        password: password.value
      }
    })

    console.log('Login response:', res)

    if ((res as any).success) {
      successMsg.value = 'Login successful! Redirecting...'
      console.log('Login successful')

      // If this is OIDC flow, redirect back to authorize endpoint
      if (isOIDCFlow.value) {
        const authorizeUrl = new URL('/api/oidc/authorize', window.location.origin)
        authorizeUrl.searchParams.set('client_id', clientId.value)
        authorizeUrl.searchParams.set('redirect_uri', redirectUri.value)
        authorizeUrl.searchParams.set('response_type', 'code')
        authorizeUrl.searchParams.set('scope', scope.value || 'openid profile email')
        authorizeUrl.searchParams.set('state', state.value)
        if (nonce.value) authorizeUrl.searchParams.set('nonce', nonce.value)
        if (codeChallenge.value) {
          authorizeUrl.searchParams.set('code_challenge', codeChallenge.value)
          authorizeUrl.searchParams.set('code_challenge_method', codeChallengeMethod.value || 'S256')
        }

        console.log('OIDC flow detected, redirecting to:', authorizeUrl.toString())
        setTimeout(() => {
          window.location.replace(authorizeUrl.toString())
        }, 500)
      } else {
        // Regular login, redirect to admin dashboard
        console.log('Regular login, redirecting to /admin')
        setTimeout(() => {
          window.location.replace('/admin')
        }, 1000)
      }
    } else {
      errorMsg.value = 'Login failed'
      isLoading.value = false
    }
  } catch (err: any) {
    console.error('Login error:', err)
    errorMsg.value = err.data?.statusMessage || err.data?.message || err.message || 'Login failed. Please try again.'
    isLoading.value = false
  }
}
</script>
