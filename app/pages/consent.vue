<template>
  <div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
    <div class="card bg-base-100 w-full max-w-lg shadow-xl">
      <div class="card-body">
        <!-- Title -->
        <h1 class="text-2xl font-bold text-center">Authorize Application</h1>
        
        <!-- Client Info -->
        <div class="text-center my-4">
          <div class="avatar placeholder">
            <div class="bg-primary text-primary-content rounded-full w-16">
              <span class="text-2xl">{{ clientInitial }}</span>
            </div>
          </div>
          <h2 class="text-xl font-semibold mt-2">{{ clientName }}</h2>
          <p class="text-base-content/60 text-sm">wants to access your account</p>
        </div>

        <!-- Scopes -->
        <div class="my-4">
          <h3 class="font-medium mb-2">This will allow the application to:</h3>
          <ul class="space-y-2">
            <li v-for="scope in scopeDescriptions" :key="scope.name" class="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-success shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              <div>
                <span class="font-medium">{{ scope.label }}</span>
                <p class="text-sm text-base-content/60">{{ scope.description }}</p>
              </div>
            </li>
          </ul>
        </div>

        <!-- User Info -->
        <div class="alert bg-base-200 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Logged in as <strong>{{ userEmail }}</strong></span>
          <a href="/login?logout=true" class="link link-primary text-sm">Switch account</a>
        </div>

        <!-- Actions -->
        <div class="flex gap-4 mt-4">
          <form method="POST" action="/api/auth/interaction" class="flex-1">
            <input type="hidden" name="uid" :value="interactionUid" />
            <input type="hidden" name="consent" value="denied" />
            <button type="submit" class="btn btn-outline btn-error w-full">
              Deny
            </button>
          </form>
          <form method="POST" action="/api/auth/interaction" class="flex-1">
            <input type="hidden" name="uid" :value="interactionUid" />
            <input type="hidden" name="consent" value="granted" />
            <button type="submit" class="btn btn-primary w-full">
              Authorize
            </button>
          </form>
        </div>

        <!-- Footer -->
        <p class="text-center text-xs text-base-content/50 mt-4">
          By authorizing, you agree to share the above information with {{ clientName }}.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const route = useRoute()

// State
const interactionUid = ref<string | null>(null)
const clientName = ref('Application')
const requestedScopes = ref<string[]>([])
const userEmail = ref('')

// Computed
const clientInitial = computed(() => clientName.value.charAt(0).toUpperCase())

const scopeDescriptions = computed(() => {
  const descriptions: Record<string, { label: string; description: string }> = {
    openid: { label: 'Verify your identity', description: 'Confirm who you are' },
    profile: { label: 'View your profile', description: 'Name, employee ID, username' },
    email: { label: 'View your email address', description: 'Your work email' },
    roles: { label: 'View your roles', description: 'Your assigned roles and permissions' },
    offline_access: { label: 'Stay signed in', description: 'Access your data when you\'re not actively using the app' }
  }

  return requestedScopes.value
    .map(scope => ({
      name: scope,
      ...(descriptions[scope] || { label: scope, description: 'Access to ' + scope })
    }))
})

// Get interaction details on mount
onMounted(async () => {
  const interaction = route.query.interaction as string

  if (!interaction) {
    navigateTo('/login')
    return
  }

  interactionUid.value = interaction

  try {
    const response = await $fetch(`/api/auth/interaction?uid=${interaction}`)
    
    if (response.prompt !== 'consent') {
      // Not a consent prompt, redirect to login
      navigateTo(`/login?interaction=${interaction}`)
      return
    }

    if (response.client) {
      clientName.value = response.client.clientName || response.client.clientId
    }

    if (response.params?.scope) {
      requestedScopes.value = (response.params.scope as string).split(' ')
    }

    if (response.session?.accountId) {
      // Fetch user email
      // For now, just show the account ID
      userEmail.value = response.session.accountId
    }
  } catch (e) {
    console.error('Failed to get interaction details:', e)
    navigateTo('/login')
  }
})
</script>
