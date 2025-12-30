<template>
  <NuxtLayout name="admin">
    <div>
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Audit Logs</h1>
        <div class="flex gap-2">
          <select v-model="filters.action" class="select select-bordered select-sm" @change="loadLogs">
            <option value="">All Actions</option>
            <option value="AUTH_LOGIN">Login Events</option>
            <option value="OIDC_TOKEN">Token Events</option>
            <option value="ADMIN_CLIENT">Client Changes</option>
            <option value="HRIS_SYNC">HRIS Sync</option>
          </select>
          <input
            type="date"
            v-model="filters.from"
            class="input input-bordered input-sm"
            @change="loadLogs"
          />
          <span class="self-center">to</span>
          <input
            type="date"
            v-model="filters.to"
            class="input input-bordered input-sm"
            @change="loadLogs"
          />
        </div>
      </div>

      <!-- Logs Table -->
      <div class="card bg-base-100 shadow">
        <div class="card-body p-0">
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Target</th>
                  <th>IP</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in logs" :key="log.id" class="hover">
                  <td class="whitespace-nowrap text-sm">
                    {{ formatDateTime(log.at) }}
                  </td>
                  <td>
                    <span class="badge badge-sm" :class="getActionBadgeClass(log.action)">
                      {{ formatAction(log.action) }}
                    </span>
                  </td>
                  <td>
                    <div v-if="log.actor?.email" class="text-sm">
                      {{ log.actor.email }}
                    </div>
                    <div v-else class="text-sm text-base-content/50">
                      {{ log.actor?.type || 'System' }}
                    </div>
                  </td>
                  <td>
                    <div v-if="log.target?.type" class="text-sm">
                      <span class="badge badge-ghost badge-xs">{{ log.target.type }}</span>
                      <span v-if="log.target.id" class="ml-1 text-xs text-base-content/50">
                        {{ log.target.id.substring(0, 8) }}...
                      </span>
                    </div>
                    <span v-else class="text-base-content/50">-</span>
                  </td>
                  <td class="text-sm text-base-content/60">
                    {{ log.context?.ip || '-' }}
                  </td>
                  <td>
                    <button
                      v-if="Object.keys(log.metadata || {}).length > 0"
                      class="btn btn-ghost btn-xs"
                      @click="showDetails(log)"
                    >
                      View
                    </button>
                  </td>
                </tr>
                <tr v-if="logs.length === 0 && !loading">
                  <td colspan="6" class="text-center py-8 text-base-content/50">
                    No audit logs found
                  </td>
                </tr>
                <tr v-if="loading">
                  <td colspan="6" class="text-center py-8">
                    <span class="loading loading-spinner loading-lg"></span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="flex justify-between items-center p-4 border-t">
            <div class="text-sm text-base-content/60">
              Showing {{ logs.length }} of {{ pagination.total }} logs
            </div>
            <div class="join">
              <button
                class="join-item btn btn-sm"
                :disabled="pagination.page <= 1"
                @click="changePage(pagination.page - 1)"
              >
                «
              </button>
              <button class="join-item btn btn-sm">
                Page {{ pagination.page }}
              </button>
              <button
                class="join-item btn btn-sm"
                :disabled="pagination.page >= pagination.totalPages"
                @click="changePage(pagination.page + 1)"
              >
                »
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Details Modal -->
      <dialog ref="detailsModal" class="modal">
        <div class="modal-box">
          <h3 class="font-bold text-lg">Log Details</h3>
          <div class="py-4">
            <div class="mb-4">
              <span class="badge" :class="getActionBadgeClass(selectedLog?.action || '')">
                {{ selectedLog?.action }}
              </span>
              <span class="ml-2 text-sm text-base-content/60">
                {{ formatDateTime(selectedLog?.at || '') }}
              </span>
            </div>
            <div class="space-y-2 text-sm">
              <div v-if="selectedLog?.actor">
                <strong>Actor:</strong>
                <span v-if="selectedLog.actor.email">
                  {{ selectedLog.actor.name || selectedLog.actor.email }}
                  <span class="text-base-content/60">({{ selectedLog.actor.email }})</span>
                </span>
                <span v-else>{{ selectedLog.actor.type }}</span>
              </div>
              <div v-if="selectedLog?.target?.type">
                <strong>Target:</strong>
                <span class="capitalize">{{ selectedLog.target.type }}</span>
                <span v-if="selectedLog.metadata?.email" class="text-base-content/60">
                  - {{ selectedLog.metadata.email }}
                </span>
                <span v-else-if="selectedLog.metadata?.name" class="text-base-content/60">
                  - {{ selectedLog.metadata.name }}
                </span>
                <code v-else class="text-xs bg-base-200 px-1 rounded ml-1">{{ selectedLog.target.id }}</code>
              </div>
              <div v-if="selectedLog?.context?.ip">
                <strong>IP:</strong> 
                <code class="bg-base-200 px-2 py-0.5 rounded">{{ selectedLog.context.ip }}</code>
              </div>
              <div v-if="selectedLog?.context?.userAgent">
                <strong>User Agent:</strong>
                <div class="text-xs break-all bg-base-200 p-2 rounded mt-1 font-mono">
                  {{ selectedLog.context.userAgent }}
                </div>
              </div>
              <div v-if="selectedLog?.context?.requestId">
                <strong>Request ID:</strong>
                <code class="text-xs bg-base-200 px-2 py-0.5 rounded">{{ selectedLog.context.requestId }}</code>
              </div>
            </div>
            <div class="divider">Metadata</div>
            <pre class="bg-base-200 p-4 rounded text-xs overflow-auto max-h-64">{{ JSON.stringify(selectedLog?.metadata, null, 2) }}</pre>
          </div>
          <div class="modal-action">
            <button class="btn" @click="closeDetails">Close</button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: false
})

interface AuditLog {
  id: string
  at: string
  actor: {
    id?: string
    email?: string
    name?: string
    type: string
  }
  action: string
  target: {
    type: string | null
    id: string | null
  }
  context: {
    ip: string | null
    userAgent: string | null
    requestId: string | null
  }
  metadata: Record<string, unknown>
}

const logs = ref<AuditLog[]>([])
const loading = ref(false)
const selectedLog = ref<AuditLog | null>(null)
const detailsModal = ref<HTMLDialogElement>()

const filters = ref({
  action: '',
  from: '',
  to: ''
})

const pagination = ref({
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0
})

onMounted(() => {
  loadLogs()
})

async function loadLogs() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString()
    })
    if (filters.value.action) params.set('action', filters.value.action)
    if (filters.value.from) params.set('from', filters.value.from)
    if (filters.value.to) params.set('to', filters.value.to)

    const res = await $fetch(`/api/admin/audit-logs?${params}`)
    logs.value = res.data
    pagination.value = res.pagination
  } catch (e) {
    console.error('Failed to load logs:', e)
  } finally {
    loading.value = false
  }
}

function changePage(page: number) {
  pagination.value.page = page
  loadLogs()
}

function formatDateTime(date: string) {
  if (!date) return ''
  return new Date(date).toLocaleString()
}

function formatAction(action: string) {
  return action.replace(/_/g, ' ').replace(/^(AUTH|OIDC|ADMIN|HRIS)\s/, '')
}

function getActionBadgeClass(action: string) {
  if (action.includes('SUCCESS') || action.includes('CREATED') || action.includes('COMPLETED')) {
    return 'badge-success'
  }
  if (action.includes('FAILED') || action.includes('DELETED')) {
    return 'badge-error'
  }
  if (action.includes('UPDATED')) {
    return 'badge-warning'
  }
  return 'badge-info'
}

function showDetails(log: AuditLog) {
  selectedLog.value = log
  detailsModal.value?.showModal()
}

function closeDetails() {
  detailsModal.value?.close()
  selectedLog.value = null
}
</script>
