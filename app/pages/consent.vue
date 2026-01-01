<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
    <div class="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <!-- Header -->
      <div class="bg-emerald-600 px-6 py-6 text-center">
        <h1 class="text-xl font-bold text-white">Authorize Application</h1>
      </div>

      <div class="p-6 space-y-6">
        <!-- Client Info -->
        <div class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 font-bold text-2xl mb-3">
            {{ clientInitial }}
          </div>
          <h2 class="text-xl font-semibold text-gray-900">{{ clientName }}</h2>
          <p class="text-gray-500 text-sm">wants to access your account</p>
        </div>

        <!-- Scopes -->
        <div>
          <h3 class="font-medium mb-3 text-gray-900">This will allow the application to:</h3>
          <ul class="space-y-3">
            <li v-for="scope in scopeDescriptions" :key="scope.name" class="flex items-start gap-3">
              <svg class="w-6 h-6 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <span class="font-medium text-gray-900">{{ scope.label }}</span>
                <p class="text-sm text-gray-500">{{ scope.description }}</p>
              </div>
            </li>
          </ul>
        </div>

        <!-- User Info -->
        <div class="bg-gray-100 p-4 rounded-lg flex items-center gap-3">
          <svg class="w-8 h-8 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-600">Logged in as</p>
            <p class="font-semibold text-gray-900 truncate">{{ userEmail }}</p>
          </div>
          <a
            href="/login?logout=true"
            class="text-sm text-emerald-600 font-medium hover:underline"
          >
            Switch account
          </a>
        </div>

        <!-- Actions -->
        <div class="flex gap-4">
          <form method="POST" action="/api/auth/interaction" class="flex-1">
            <input type="hidden" name="uid" :value="interactionUid" />
            <input type="hidden" name="consent" value="denied" />
            <button
              type="submit"
              class="w-full py-3 px-4 border-2 border-red-500 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors"
            >
              Deny
            </button>
          </form>
          <form method="POST" action="/api/auth/interaction" class="flex-1">
            <input type="hidden" name="uid" :value="interactionUid" />
            <input type="hidden" name="consent" value="granted" />
            <button
              type="submit"
              class="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
            >
              Authorize
            </button>
          </form>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <p class="text-center text-xs text-gray-500">
          By authorizing, you agree to share the above information with {{ clientName }}.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  layout: false
})

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
