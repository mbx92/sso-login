<template>
  <NuxtLayout name="admin">
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">Active Sessions</h1>
          <p class="text-sm text-gray-500 mt-1">Monitor users currently logged in to applications</p>
        </div>
        <button
          @click="fetchSessions"
          :disabled="loading"
          class="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <svg v-if="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <!-- Stats Summary -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <!-- Online Now Card -->
        <button 
          @click="showOnlineOnly = !showOnlineOnly"
          :class="[
            'bg-white rounded-xl border p-5 shadow-sm text-left transition-all',
            showOnlineOnly ? 'border-green-500 ring-2 ring-green-500/20' : 'border-gray-200 hover:border-green-200'
          ]"
        >
          <div class="flex items-center gap-4">
            <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-green-100">
              <div class="relative">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
                <span class="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              </div>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500 uppercase tracking-wide">Online Now</p>
              <p class="text-2xl font-semibold text-gray-900">{{ onlineUsers }}</p>
            </div>
          </div>
          <p class="mt-2 text-xs text-gray-500">{{ showOnlineOnly ? 'Click to show all' : 'Click to filter' }}</p>
        </button>

        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div class="flex items-center gap-4">
            <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-100">
              <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500 uppercase tracking-wide">Active Users</p>
              <p class="text-2xl font-semibold text-gray-900">{{ uniqueUsers }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div class="flex items-center gap-4">
            <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Sessions</p>
              <p class="text-2xl font-semibold text-gray-900">{{ sessions.length }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div class="flex items-center gap-4">
            <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-violet-100">
              <svg class="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500 uppercase tracking-wide">Applications</p>
              <p class="text-2xl font-semibold text-gray-900">{{ uniqueApps }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Sessions Table -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Session Details</h3>
        </div>
        
        <div v-if="loading" class="p-8 text-center">
          <svg class="animate-spin w-8 h-8 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="mt-2 text-gray-500">Loading sessions...</p>
        </div>

        <div v-else-if="sessions.length === 0" class="p-8 text-center">
          <svg class="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p class="text-gray-500">No active sessions</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Application</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Browser</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login Time</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="session in filteredSessions" :key="session.id" class="hover:bg-gray-50">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <!-- Avatar with online indicator -->
                    <div class="relative">
                      <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">
                        {{ getInitials(session.userName) }}
                      </div>
                      <!-- Online indicator chip -->
                      <span 
                        v-if="session.isOnline" 
                        class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"
                        title="Online"
                      ></span>
                      <span 
                        v-else 
                        class="absolute bottom-0 right-0 w-3 h-3 bg-gray-300 border-2 border-white rounded-full"
                        title="Offline"
                      ></span>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900">{{ session.userName }}</p>
                      <p class="text-xs text-gray-500">{{ session.userEmail }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <span class="text-sm text-gray-900">{{ session.clientName }}</span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    {{ session.ip }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-500 max-w-[200px] truncate block" :title="session.userAgent">
                    {{ getBrowserInfo(session.userAgent) }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-gray-900">{{ formatDateTime(session.loginAt) }}</span>
                </td>
                <td class="px-6 py-4">
                  <span v-if="session.expiresAt" class="text-sm text-gray-500">
                    {{ formatRelativeTime(session.expiresAt) }}
                  </span>
                  <span v-else class="text-sm text-gray-400">Never</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <button
                    @click="openRevokeModal(session)"
                    :disabled="revokingId === session.id"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <svg v-if="revokingId === session.id" class="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    Revoke
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Revoke Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showRevokeModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50" @click="closeRevokeModal"></div>
        
        <!-- Modal -->
        <div class="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
          <!-- Icon -->
          <div class="flex justify-center mb-4">
            <div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          
          <!-- Title -->
          <h3 class="text-lg font-semibold text-gray-900 text-center mb-2">Revoke Session</h3>
          
          <!-- Message -->
          <p class="text-gray-600 text-center mb-6">
            Are you sure you want to revoke the session for <strong class="text-gray-900">{{ sessionToRevoke?.userName }}</strong>? 
            They will be logged out from <strong class="text-gray-900">{{ sessionToRevoke?.clientName }}</strong>.
          </p>
          
          <!-- Actions -->
          <div class="flex gap-3">
            <button
              @click="closeRevokeModal"
              class="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              @click="confirmRevoke"
              :disabled="revokingId !== null"
              class="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg v-if="revokingId" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Revoke Session
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Error Toast -->
    <Teleport to="body">
      <div v-if="errorMessage" class="fixed bottom-4 right-4 z-50">
        <div class="bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ errorMessage }}</span>
          <button @click="errorMessage = ''" class="ml-2 hover:opacity-75">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </Teleport>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth']
})

interface Session {
  id: string
  userId: string
  userName: string
  userEmail: string
  clientId: string
  clientName: string
  ip: string
  userAgent: string
  loginAt: string
  expiresAt: string | null
  isOnline: boolean
  lastActivityAt: string | null
}

const sessions = ref<Session[]>([])
const loading = ref(false)
const revokingId = ref<string | null>(null)
const showRevokeModal = ref(false)
const sessionToRevoke = ref<Session | null>(null)
const errorMessage = ref('')
const showOnlineOnly = ref(false)

const filteredSessions = computed(() => {
  if (showOnlineOnly.value) {
    return sessions.value.filter(s => s.isOnline)
  }
  return sessions.value
})

const uniqueUsers = computed(() => {
  return new Set(sessions.value.map(s => s.userId)).size
})

const onlineUsers = computed(() => {
  return sessions.value.filter(s => s.isOnline).length
})

const uniqueApps = computed(() => {
  return new Set(sessions.value.map(s => s.clientId)).size
})

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getBrowserInfo(userAgent: string): string {
  if (!userAgent || userAgent === 'Unknown') return 'Unknown'
  
  // Simple browser detection
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari'
  if (userAgent.includes('Edg')) return 'Edge'
  if (userAgent.includes('MSIE') || userAgent.includes('Trident')) return 'IE'
  
  // Return first 30 chars if unknown
  return userAgent.substring(0, 30) + '...'
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffMins = Math.round(diffMs / 60000)
  const diffHours = Math.round(diffMs / 3600000)
  const diffDays = Math.round(diffMs / 86400000)
  
  if (diffMins < 0) return 'Expired'
  if (diffMins < 60) return `in ${diffMins}m`
  if (diffHours < 24) return `in ${diffHours}h`
  return `in ${diffDays}d`
}

async function fetchSessions() {
  loading.value = true
  try {
    const res = await $fetch('/api/admin/sessions')
    sessions.value = (res as any).data || []
  } catch (error) {
    console.error('Failed to fetch sessions:', error)
  } finally {
    loading.value = false
  }
}

function openRevokeModal(session: Session) {
  sessionToRevoke.value = session
  showRevokeModal.value = true
}

function closeRevokeModal() {
  showRevokeModal.value = false
  sessionToRevoke.value = null
}

async function confirmRevoke() {
  if (!sessionToRevoke.value) return
  
  const session = sessionToRevoke.value
  revokingId.value = session.id
  
  try {
    await $fetch(`/api/admin/sessions/${session.id}`, { method: 'DELETE' })
    // Remove from local list
    sessions.value = sessions.value.filter(s => s.id !== session.id)
    closeRevokeModal()
  } catch (error) {
    console.error('Failed to revoke session:', error)
    errorMessage.value = 'Failed to revoke session. Please try again.'
    setTimeout(() => { errorMessage.value = '' }, 5000)
  } finally {
    revokingId.value = null
  }
}

onMounted(() => {
  fetchSessions()
})
</script>
