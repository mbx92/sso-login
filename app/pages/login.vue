<template>
  <div class="min-h-screen bg-gradient-to-br from-primary/10 via-base-200 to-secondary/10 flex items-center justify-center p-4">
    <div class="card bg-base-100 w-full max-w-md shadow-2xl">
      <div class="card-body p-8">
        <!-- Logo / Title -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-primary">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-base-content">SSO Login</h1>
          <p class="text-base-content/60 mt-2">Identity Provider Portal</p>
        </div>

        <!-- Error Alert -->
        <div v-if="errorMsg" class="alert alert-error shadow-lg mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ errorMsg }}</span>
        </div>

        <!-- Success Alert -->
        <div v-if="successMsg" class="alert alert-success shadow-lg mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ successMsg }}</span>
        </div>

        <!-- Login Form -->
        <div class="space-y-4">
          <!-- Email -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Email Address</span>
            </label>
            <input
              v-model="email"
              type="email"
              placeholder="admin@example.com"
              class="input input-bordered w-full focus:input-primary"
              autocomplete="email"
              @keyup.enter="doLogin"
            />
          </div>

          <!-- Password -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Password</span>
            </label>
            <input
              v-model="password"
              type="password"
              placeholder="••••••••"
              class="input input-bordered w-full focus:input-primary"
              autocomplete="current-password"
              @keyup.enter="doLogin"
            />
          </div>

          <!-- Submit Button -->
          <div class="form-control mt-6">
            <button
              type="button"
              class="btn btn-primary w-full text-lg h-12"
              :disabled="isLoading"
              @click="doLogin"
            >
              <span v-if="isLoading" class="loading loading-spinner loading-md"></span>
              <span v-else>Sign In</span>
            </button>
          </div>

          <!-- Fill Test Credentials (Dev only) -->
          <div v-if="isDev" class="form-control">
            <button
              type="button"
              class="btn btn-outline btn-sm w-full gap-2"
              @click="fillTest"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              Fill Test Credentials
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="divider my-6"></div>
        <p class="text-center text-sm text-base-content/60">
          Need help? Contact 
          <a href="mailto:it-support@company.com" class="link link-primary font-medium">IT Support</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
  password.value = 'password123!'
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
    
    if (res.success) {
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
    errorMsg.value = err.data?.message || err.message || 'Login failed. Please try again.'
    isLoading.value = false
  }
}
</script>
