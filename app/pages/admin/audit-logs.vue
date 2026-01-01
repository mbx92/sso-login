<template>
  <NuxtLayout name="admin">
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">Audit Logs</h1>
          <p class="text-sm text-gray-500 mt-1">View system activity and security events</p>
        </div>
        <div class="flex items-center gap-2">
          <select
            v-model="filter"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">All Actions</option>
            <option value="AUTH_LOGIN">Login</option>
            <option value="AUTH_LOGOUT">Logout</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="OIDC">OIDC</option>
          </select>
          <button
            @click="loadLogs"
            class="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Logs Table -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <!-- Loading State -->
        <div v-if="loading" class="p-8 text-center">
          <svg class="animate-spin w-8 h-8 mx-auto text-emerald-500" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="mt-2 text-gray-500">Loading logs...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="logs.length === 0" class="p-8 text-center">
          <svg class="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-gray-500">No logs found</p>
        </div>

        <!-- Table -->
        <table v-else class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actor</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="log in logs" :key="log.id" class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <span :class="[
                  'px-2.5 py-1 text-xs font-medium rounded-full',
                  getActionStyle(log.action)
                ]">
                  {{ formatAction(log.action) }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <span class="text-gray-600 text-sm font-medium">
                      {{ log.actor?.email ? log.actor.email.charAt(0).toUpperCase() : '?' }}
                    </span>
                  </div>
                  <div>
                    <div class="text-sm text-gray-900">{{ log.actor?.email || log.actor?.type || '-' }}</div>
                    <div v-if="log.actor?.name" class="text-xs text-gray-500">{{ log.actor.name }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ log.target?.type || '-' }}</td>
              <td class="px-6 py-4 text-sm text-gray-600 font-mono">{{ log.context?.ip || '-' }}</td>
              <td class="px-6 py-4 text-sm text-gray-500">{{ formatDate(log.at) }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p class="text-sm text-gray-600">
            Showing {{ logs.length }} logs
          </p>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth']
})

const logs = ref<any[]>([])
const loading = ref(true)
const filter = ref('')

async function loadLogs() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (filter.value) params.set('action', filter.value)
    
    const res = await $fetch(`/api/admin/audit-logs?${params.toString()}`)
    logs.value = (res as any).data || []
  } catch (error) {
    console.error('Failed to load logs:', error)
  } finally {
    loading.value = false
  }
}

function formatAction(action: string) {
  return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function getActionStyle(action: string) {
  if (action.includes('success')) return 'bg-green-100 text-green-800'
  if (action.includes('failed')) return 'bg-red-100 text-red-800'
  if (action.includes('logout')) return 'bg-gray-100 text-gray-800'
  return 'bg-blue-100 text-blue-800'
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

watch(filter, () => {
  loadLogs()
})

onMounted(() => {
  loadLogs()
})
</script>
