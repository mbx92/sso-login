<template>
  <NuxtLayout name="admin">
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">User Access</h1>
          <p class="text-sm text-gray-500 mt-1">Manage user access to OIDC clients</p>
        </div>
        <button
          @click="showGrantModal = true"
          class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Grant Access
        </button>
      </div>

      <!-- Access List -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <!-- Loading State -->
        <div v-if="loading" class="p-8 text-center">
          <svg class="animate-spin w-8 h-8 mx-auto text-emerald-500" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="mt-2 text-gray-500">Loading access records...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="accessList.length === 0" class="p-8 text-center">
          <svg class="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No access records</h3>
          <p class="text-gray-500 mb-4">Grant access to users for specific clients</p>
        </div>

        <!-- Table -->
        <table v-else class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Granted By</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Granted At</th>
              <th class="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="access in accessList" :key="access.id" class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <span class="text-emerald-700 text-sm font-medium">{{ (access.userName || access.userEmail || '?').charAt(0).toUpperCase() }}</span>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ access.userName || '-' }}</p>
                    <p class="text-xs text-gray-500">{{ access.userEmail || '-' }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-gray-900">{{ access.clientName || access.clientId }}</span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ access.grantedByEmail || '-' }}</td>
              <td class="px-6 py-4 text-sm text-gray-500">{{ formatDate(access.grantedAt) }}</td>
              <td class="px-6 py-4 text-right">
                <button
                  @click="revokeAccess(access)"
                  class="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Revoke
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Grant Access Modal -->
      <div v-if="showGrantModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="closeGrantModal"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Grant Access</h3>
          </div>
          <form @submit.prevent="grantAccess" class="p-6 space-y-4">
            <!-- User Search Input with Nuxt UI InputMenu -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">User</label>
              <UInputMenu
                v-model="selectedUser"
                v-model:search-term="userSearchTerm"
                :items="userItems"
                :loading="isSearching"
                ignore-filter
                placeholder="Ketik nama, email, atau NIP..."
                icon="i-lucide-user"
                :filter-fields="['label', 'email', 'employeeId']"
                class="w-full"
                value-key="id"
              >
                <template #item-label="{ item }">
                  <div class="flex flex-col">
                    <span>{{ item.label }}</span>
                    <span class="text-xs text-gray-500">{{ item.email }}{{ item.employeeId ? ` • ${item.employeeId}` : '' }}</span>
                  </div>
                </template>
              </UInputMenu>
            </div>
            
            <!-- Client Select with Nuxt UI Select -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Client</label>
              <USelect
                v-model="grantForm.clientId"
                :items="clientItems"
                placeholder="Pilih client..."
                value-key="value"
                class="w-full"
              />
            </div>
            
            <div class="flex gap-3 pt-4">
              <UButton
                type="button"
                variant="outline"
                color="neutral"
                class="flex-1"
                @click="closeGrantModal"
              >
                Cancel
              </UButton>
              <UButton
                type="submit"
                :disabled="saving || !selectedUser || !grantForm.clientId"
                :loading="saving"
                color="primary"
                class="flex-1"
              >
                Grant Access
              </UButton>
            </div>
          </form>
        </div>
      </div>

      <!-- Revoke Confirmation Modal -->
      <ConfirmModal
        :isOpen="showRevokeModal"
        title="Revoke Access"
        :message="`Are you sure you want to revoke access for '${accessToRevoke?.userName || accessToRevoke?.userEmail}' to '${accessToRevoke?.clientName}'?`"
        type="danger"
        confirmText="Revoke"
        cancelText="Cancel"
        @confirm="doRevokeAccess"
        @cancel="showRevokeModal = false"
      />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { refDebounced } from '@vueuse/core'

definePageMeta({
  middleware: ['auth']
})

interface AccessRecord {
  id: string
  userId: string
  clientId: string
  grantedBy: string | null
  grantedAt: string
  expiresAt: string | null
  isActive: boolean
  notes: string | null
  userName: string | null
  userEmail: string | null
  userDepartment: string | null
  clientName: string | null
  clientDescription: string | null
  grantedByEmail?: string | null
}

interface UserItem {
  id: string
  label: string
  email: string
  employeeId: string | null
}

const accessList = ref<AccessRecord[]>([])
const clients = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const showGrantModal = ref(false)
const showRevokeModal = ref(false)
const accessToRevoke = ref<AccessRecord | null>(null)

// User search state for UInputMenu
const userSearchTerm = ref('')
const userSearchTermDebounced = refDebounced(userSearchTerm, 300)
const userItems = ref<UserItem[]>([])
const selectedUser = ref<UserItem | null>(null)
const isSearching = ref(false)

const grantForm = ref({
  clientId: ''
})

// Computed client items for USelect
const clientItems = computed(() => {
  return clients.value.map(client => ({
    label: client.clientName || client.name || client.clientId,
    value: client.id
  }))
})

// Watch debounced search term and fetch users
watch(userSearchTermDebounced, async (searchTerm) => {
  if (!searchTerm || searchTerm.length < 2) {
    userItems.value = []
    isSearching.value = false
    return
  }
  
  isSearching.value = true
  try {
    const res = await $fetch(`/api/admin/users?search=${encodeURIComponent(searchTerm)}&limit=10`)
    const users = (res as any).data || []
    userItems.value = users.map((user: any) => ({
      id: user.id,
      label: user.name,
      email: user.email,
      employeeId: user.employeeId
    }))
  } catch (error) {
    console.error('Search error:', error)
    userItems.value = []
  } finally {
    isSearching.value = false
  }
})

async function loadData() {
  loading.value = true
  try {
    const [accessRes, clientsRes] = await Promise.all([
      $fetch('/api/admin/user-access'),
      $fetch('/api/admin/clients')
    ])
    
    accessList.value = (accessRes as any).data || []
    clients.value = (clientsRes as any).data || (clientsRes as any).clients || []
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    loading.value = false
  }
}

function closeGrantModal() {
  showGrantModal.value = false
  selectedUser.value = null
  userSearchTerm.value = ''
  userItems.value = []
  grantForm.value.clientId = ''
}

async function grantAccess() {
  if (!selectedUser.value) return
  
  saving.value = true
  try {
    await $fetch('/api/admin/user-access', {
      method: 'POST',
      body: {
        userId: selectedUser.value.id,
        clientId: grantForm.value.clientId
      }
    })
    closeGrantModal()
    await loadData()
  } catch (error) {
    console.error('Failed to grant access:', error)
  } finally {
    saving.value = false
  }
}

function revokeAccess(access: AccessRecord) {
  accessToRevoke.value = access
  showRevokeModal.value = true
}

async function doRevokeAccess() {
  if (!accessToRevoke.value) return
  
  try {
    await $fetch(`/api/admin/user-access/${accessToRevoke.value.id}`, {
      method: 'DELETE'
    })
    showRevokeModal.value = false
    accessToRevoke.value = null
    await loadData()
  } catch (error) {
    console.error('Failed to revoke access:', error)
  }
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

onMounted(() => {
  loadData()
})
</script>
