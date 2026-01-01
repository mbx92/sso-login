<template>
  <NuxtLayout name="admin">
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p class="text-sm text-gray-500 mt-1">Overview of your SSO system</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="triggerHrisSync"
            :disabled="syncLoading"
            class="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <svg v-if="syncLoading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sync HRIS
          </button>
          <NuxtLink
            to="/admin/clients"
            class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New Client
          </NuxtLink>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Users Card -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div class="flex items-center gap-4">
            <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-100">
              <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500 uppercase tracking-wide">Users</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.totalUsers.toLocaleString() }}</p>
            </div>
          </div>
          <div class="mt-3 flex items-center text-sm">
            <svg class="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span class="text-green-600 font-medium">{{ stats.activeUsers }}</span>
            <span class="text-gray-500 ml-1">active</span>
          </div>
        </div>

        <!-- Clients Card -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div class="flex items-center gap-4">
            <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500 uppercase tracking-wide">Clients</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.totalClients.toLocaleString() }}</p>
            </div>
          </div>
          <div class="mt-3 flex items-center text-sm">
            <svg class="w-4 h-4 text-blue-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-blue-600 font-medium">{{ stats.activeClients }}</span>
            <span class="text-gray-500 ml-1">active</span>
          </div>
        </div>

        <!-- Logins Today Card -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div class="flex items-center gap-4">
            <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-amber-100">
              <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500 uppercase tracking-wide">Logins Today</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.loginsToday.toLocaleString() }}</p>
            </div>
          </div>
          <div class="mt-3 flex items-center text-sm">
            <svg class="w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-gray-500">Last 24 hours</span>
          </div>
        </div>

        <!-- Sessions Card -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div class="flex items-center gap-4">
            <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-violet-100">
              <svg class="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500 uppercase tracking-wide">Active Sessions</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.activeSessions?.toLocaleString() || '0' }}</p>
            </div>
          </div>
          <div class="mt-3 flex items-center text-sm">
            <svg class="w-4 h-4 text-violet-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span class="text-gray-500">Authenticated</span>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div class="p-6">
          <div v-if="recentLogs.length === 0" class="text-center py-8">
            <svg class="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-gray-500">No recent activity</p>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="log in recentLogs"
              :key="log.id"
              class="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
            >
              <div :class="[
                'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                log.action === 'login_success' ? 'bg-green-100' : 
                log.action === 'login_failed' ? 'bg-red-100' : 'bg-blue-100'
              ]">
                <svg v-if="log.action === 'login_success'" class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-else-if="log.action === 'login_failed'" class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-else class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ log.action.replace(/_/g, ' ') }}</p>
                <p class="text-xs text-gray-500 truncate">{{ log.userEmail || 'Unknown user' }}</p>
              </div>
              <span class="text-xs text-gray-400 shrink-0">{{ formatTime(log.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth']
})

const stats = ref({
  totalUsers: 0,
  activeUsers: 0,
  totalClients: 0,
  activeClients: 0,
  loginsToday: 0,
  activeSessions: 0
})

const recentLogs = ref<any[]>([])
const syncLoading = ref(false)

// Fetch dashboard data
async function fetchStats() {
  try {
    const [usersRes, clientsRes, logsRes] = await Promise.all([
      $fetch('/api/admin/users'),
      $fetch('/api/admin/clients'),
      $fetch('/api/admin/audit-logs?limit=5')
    ])
    
    const users = (usersRes as any).users || []
    const clients = (clientsRes as any).clients || []
    const logs = (logsRes as any).logs || []
    
    stats.value = {
      totalUsers: users.length,
      activeUsers: users.filter((u: any) => u.isActive).length,
      totalClients: clients.length,
      activeClients: clients.length,
      loginsToday: logs.filter((l: any) => l.action === 'login_success').length,
      activeSessions: 0
    }
    
    recentLogs.value = logs.slice(0, 5)
  } catch (error) {
    console.error('Failed to fetch stats:', error)
  }
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

async function triggerHrisSync() {
  syncLoading.value = true
  try {
    await $fetch('/api/admin/sync/hris', { method: 'POST' })
    await fetchStats()
  } catch (error) {
    console.error('HRIS sync failed:', error)
  } finally {
    syncLoading.value = false
  }
}

onMounted(() => {
  fetchStats()
})
</script>
