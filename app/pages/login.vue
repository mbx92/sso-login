<template>
  <div class="relative flex min-h-screen items-center justify-center bg-canvas p-4 md:p-8">
    <div class="absolute inset-x-0 top-0 border-b border-hairline-soft">
      <div class="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6">
        <div class="flex items-center gap-2">
          <div class="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold tracking-tight">
            SSO
          </div>
          <span class="text-[14px] font-semibold text-ink">SSO Login</span>
        </div>
        <a
          href="mailto:it-support@company.com"
          class="text-[14px] font-medium text-ink"
        >
          Contact Us
        </a>
      </div>
    </div>

    <div class="relative z-10 w-full max-w-md pt-16">
      <div class="mb-10 text-center">
        <h1 class="text-heading-md text-ink md:text-heading-lg">
          Sign in to continue
        </h1>
        <p class="mt-3 text-subtitle text-steel">
          Identity Provider Portal
        </p>
      </div>

      <div class="card-mm shadow-mm-1 space-y-5">
        <Alert v-if="errorMsg" variant="destructive">
          <AlertCircle class="size-4" />
          <AlertTitle class="text-[14px] font-semibold">Login failed</AlertTitle>
          <AlertDescription class="text-[14px]">{{ errorMsg }}</AlertDescription>
        </Alert>

        <Alert v-if="successMsg">
          <CheckCircle2 class="size-4 text-success-text" />
          <AlertTitle class="text-[14px] font-semibold">Success</AlertTitle>
          <AlertDescription class="text-[14px]">{{ successMsg }}</AlertDescription>
        </Alert>

        <form class="space-y-5" @submit.prevent="doLogin">
          <div class="space-y-2">
            <Label for="email" class="text-[14px] font-medium text-ink">Email Address</Label>
            <Input
              id="email"
              v-model="email"
              type="email"
              placeholder="admin@example.com"
              autocomplete="email"
            />
          </div>

          <div class="space-y-2">
            <Label for="password" class="text-[14px] font-medium text-ink">Password</Label>
            <Input
              id="password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              autocomplete="current-password"
            />
          </div>

          <Button type="submit" class="w-full" :disabled="isLoading">
            <Loader2 v-if="isLoading" class="size-4 animate-spin" />
            {{ isLoading ? 'Signing in...' : 'Sign In' }}
          </Button>

          <Button
            v-if="isDev"
            type="button"
            variant="outline"
            class="w-full"
            @click="fillTest"
          >
            Fill Test Credentials
          </Button>
        </form>
      </div>

      <p class="mt-8 text-center text-[14px] text-steel">
        Need help?
        <a href="mailto:it-support@company.com" class="font-medium text-ink underline-offset-4 active:underline">
          IT Support
        </a>
      </p>
    </div>
  </div>
</template>

<script setup>
import { AlertCircle, CheckCircle2, Loader2 } from '@lucide/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

definePageMeta({
  layout: false,
})

const route = useRoute()
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const isDev = process.env.NODE_ENV !== 'production'
const clientId = computed(() => route.query.client_id)
const redirectUri = computed(() => route.query.redirect_uri)
const state = computed(() => route.query.state)
const scope = computed(() => route.query.scope)
const nonce = computed(() => route.query.nonce)
const codeChallenge = computed(() => route.query.code_challenge)
const codeChallengeMethod = computed(() => route.query.code_challenge_method)
const isOIDCFlow = computed(() => !!clientId.value && !!redirectUri.value && !!state.value)

function fillTest() {
  email.value = 'admin@example.com'
  password.value = 'password123!'
  errorMsg.value = ''
  successMsg.value = ''
}

async function doLogin() {
  errorMsg.value = ''
  successMsg.value = ''
  if (!email.value || !password.value) {
    errorMsg.value = 'Please enter email and password'
    return
  }
  isLoading.value = true
  try {
    const res = await $fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      body: {
        email: email.value,
        password: password.value,
      },
    })
    if (res.success) {
      successMsg.value = 'Login successful! Redirecting...'
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
        setTimeout(() => {
          window.location.replace(authorizeUrl.toString())
        }, 500)
      } else {
        setTimeout(() => {
          window.location.replace('/admin')
        }, 1000)
      }
    } else {
      errorMsg.value = 'Login failed'
      isLoading.value = false
    }
  } catch (err) {
    errorMsg.value = err.data?.statusMessage || err.data?.message || err.message || 'Login failed. Please try again.'
    isLoading.value = false
  }
}
</script>
