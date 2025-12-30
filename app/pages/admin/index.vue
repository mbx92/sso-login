<template>
  <NuxtLayout name="admin">
    <div>
      <h1 class="text-2xl font-bold mb-6">Dashboard</h1>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="stat bg-base-100 shadow rounded-box">
          <div class="stat-figure text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div class="stat-title">Total Users</div>
          <div class="stat-value text-primary">{{ stats.totalUsers }}</div>
          <div class="stat-desc">{{ stats.activeUsers }} active</div>
        </div>

        <div class="stat bg-base-100 shadow rounded-box">
          <div class="stat-figure text-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div class="stat-title">OIDC Clients</div>
          <div class="stat-value text-secondary">{{ stats.totalClients }}</div>
          <div class="stat-desc">{{ stats.activeClients }} active</div>
        </div>

        <div class="stat bg-base-100 shadow rounded-box">
          <div class="stat-figure text-accent">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="stat-title">Logins Today</div>
          <div class="stat-value text-accent">{{ stats.loginsToday }}</div>
          <div class="stat-desc">Last 24 hours</div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card bg-base-100 shadow mb-8">
        <div class="card-body">
          <h2 class="card-title">Quick Actions</h2>
          <div class="flex flex-wrap gap-4 mt-4">
            <NuxtLink to="/admin/clients" class="btn btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              New OIDC Client
            </NuxtLink>
            <button @click="triggerHrisSync" class="btn btn-secondary" :disabled="syncLoading">
              <span v-if="syncLoading" class="loading loading-spinner loading-sm"></span>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sync HRIS
            </button>
            <NuxtLink to="/admin/audit-logs" class="btn btn-outline">
              View Audit Logs
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <h2 class="card-title">Recent Activity</h2>
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in recentLogs" :key="log.id">
                  <td class="text-sm">{{ formatDate(log.at) }}</td>
                  <td>
                    <span class="badge" :class="getActionBadgeClass(log.action)">
                      {{ log.action }}
                    </span>
                  </td>
                  <td>{{ log.actor?.email || log.actor?.type || 'System' }}</td>
                  <td class="text-sm text-base-content/60">
                    {{ log.target?.type }} {{ log.target?.id ? `#${log.target.id.substring(0, 8)}` : '' }}
                  </td>
                </tr>
                <tr v-if="recentLogs.length === 0">
                  <td colspan="4" class="text-center text-base-content/50">No recent activity</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: false,
  middleware: 'auth'
})

// State
const stats = ref({
  totalUsers: 0,
  activeUsers: 0,
  totalClients: 0,
  activeClients: 0,
  loginsToday: 0
})

const recentLogs = ref<any[]>([])
const syncLoading = ref(false)

// Load data on mount
onMounted(async () => {
  await Promise.all([
    loadStats(),
    loadRecentLogs()
  ])
})

async function loadStats() {
  try {
    const [usersRes, clientsRes] = await Promise.all([
      $fetch('/api/admin/users?limit=1'),
      $fetch('/api/admin/clients?limit=1')
    ])

    stats.value.totalUsers = usersRes.pagination.total
    stats.value.activeUsers = usersRes.pagination.total // TODO: filter active
    stats.value.totalClients = clientsRes.pagination.total
    stats.value.activeClients = clientsRes.pagination.total // TODO: filter active
  } catch (e) {
    console.error('Failed to load stats:', e)
  }
}

async function loadRecentLogs() {
  try {
    const res = await $fetch('/api/admin/audit-logs?limit=10')
    recentLogs.value = res.data
  } catch (e) {
    console.error('Failed to load logs:', e)
  }
}

async function triggerHrisSync() {
  syncLoading.value = true
  try {
    await $fetch('/api/admin/sync/hris', { method: 'POST' })
    await loadStats()
  } catch (e) {
    console.error('Sync failed:', e)
  } finally {
    syncLoading.value = false
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleString()
}

function getActionBadgeClass(action: string) {
  if (action.includes('SUCCESS') || action.includes('CREATED')) return 'badge-success'
  if (action.includes('FAILED') || action.includes('DELETED')) return 'badge-error'
  if (action.includes('UPDATED')) return 'badge-warning'
  return 'badge-info'
}
</script>
