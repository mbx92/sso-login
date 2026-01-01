<template>
  <NuxtLayout name="admin">
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">OIDC Clients</h1>
          <p class="text-sm text-gray-500 mt-1">Manage OAuth/OIDC client applications</p>
        </div>
        <button
          @click="showCreateModal = true"
          class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Client
        </button>
      </div>

      <!-- Clients Grid -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="i in 3" :key="i" class="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div class="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div class="h-3 bg-gray-200 rounded w-full"></div>
        </div>
      </div>

      <div v-else-if="clients.length === 0" class="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <svg class="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No clients yet</h3>
        <p class="text-gray-500 mb-4">Create your first OIDC client to get started</p>
        <button
          @click="showCreateModal = true"
          class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
        >
          Create Client
        </button>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="client in clients"
          :key="client.id"
          class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900">{{ client.name || client.clientId }}</h3>
                <p class="text-xs text-gray-500">{{ client.clientId }}</p>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <button
                @click="editClient(client)"
                class="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-gray-100 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                @click="confirmDelete(client)"
                class="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          
          <div class="space-y-2 text-sm">
            <div>
              <span class="text-gray-500">Type:</span>
              <span :class="[
                'ml-2 px-2 py-0.5 rounded text-xs font-medium',
                client.clientSecretHash ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
              ]">
                {{ client.clientSecretHash ? 'confidential' : 'public' }}
              </span>
            </div>
            <div class="text-gray-500 truncate">
              <span>Redirect:</span>
              <span class="ml-2 text-gray-700">{{ (client.redirectUris || [])[0] || '-' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div v-if="showCreateModal || showEditModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="closeModal"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">{{ showEditModal ? 'Edit Client' : 'Create Client' }}</h3>
          </div>
          <form @submit.prevent="showEditModal ? updateClient() : createClient()" class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Client Name</label>
              <input
                v-model="form.clientName"
                type="text"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="My Application"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Redirect URIs (one per line)</label>
              <textarea
                v-model="form.redirectUris"
                rows="3"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="https://myapp.com/callback"
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Client Type</label>
              <select
                v-model="form.clientType"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="public">Public</option>
                <option value="confidential">Confidential</option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <input
                v-model="form.accessControlEnabled"
                type="checkbox"
                id="accessControl"
                class="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <label for="accessControl" class="text-sm text-gray-700">Enable Access Control</label>
            </div>
            <div class="flex gap-3 pt-4">
              <button
                type="button"
                @click="closeModal"
                class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg transition-colors"
              >
                {{ saving ? 'Saving...' : (showEditModal ? 'Update' : 'Create') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="showDeleteModal = false"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
          <div class="text-center">
            <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Delete Client</h3>
            <p class="text-gray-500 mb-6">Are you sure you want to delete "{{ clientToDelete?.clientName }}"? This action cannot be undone.</p>
            <div class="flex gap-3">
              <button
                @click="showDeleteModal = false"
                class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                @click="deleteClient"
                :disabled="deleting"
                class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors"
              >
                {{ deleting ? 'Deleting...' : 'Delete' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Client Secret Display Modal -->
      <div v-if="showSecretModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
          <div class="text-center mb-6">
            <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Client Created Successfully!</h3>
            <p class="text-amber-600 text-sm font-medium">⚠️ Save these credentials now - the secret will not be shown again!</p>
          </div>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  readonly
                  :value="createdClient?.clientId"
                  class="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
                />
                <button
                  @click="copyToClipboard(createdClient?.clientId)"
                  class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Copy"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div v-if="createdClient?.clientSecret">
              <label class="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
              <div class="flex items-center gap-2">
                <input
                  :type="showSecret ? 'text' : 'password'"
                  readonly
                  :value="createdClient?.clientSecret"
                  class="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
                />
                <button
                  @click="showSecret = !showSecret"
                  class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Toggle visibility"
                >
                  <svg v-if="showSecret" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button
                  @click="copyToClipboard(createdClient?.clientSecret)"
                  class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Copy"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            <div v-else>
              <p class="text-sm text-gray-500 italic">This is a public client - no secret required.</p>
            </div>
          </div>
          
          <div class="mt-6">
            <button
              @click="closeSecretModal"
              class="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              I've saved the credentials
            </button>
          </div>
        </div>
      </div>

      <!-- Toast Notification -->
      <Transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-2"
      >
        <div v-if="toast.show" class="fixed bottom-4 right-4 z-50">
          <div :class="[
            'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[280px]',
            toast.type === 'success' ? 'bg-green-600 text-white' : '',
            toast.type === 'error' ? 'bg-red-600 text-white' : '',
            toast.type === 'info' ? 'bg-blue-600 text-white' : ''
          ]">
            <svg v-if="toast.type === 'success'" class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else-if="toast.type === 'error'" class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <svg v-else class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-sm font-medium">{{ toast.message }}</span>
            <button @click="toast.show = false" class="ml-auto p-1 hover:bg-white/20 rounded transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth']
})

const clients = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showSecretModal = ref(false)
const showSecret = ref(false)
const clientToDelete = ref<any>(null)
const editingClient = ref<any>(null)
const createdClient = ref<any>(null)

// Toast notification state
const toast = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error' | 'info'
})

let toastTimeout: ReturnType<typeof setTimeout> | null = null

function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  if (toastTimeout) clearTimeout(toastTimeout)
  toast.value = { show: true, message, type }
  toastTimeout = setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

const form = ref({
  clientName: '',
  redirectUris: '',
  clientType: 'public',
  accessControlEnabled: false
})

async function loadClients() {
  loading.value = true
  try {
    const res = await $fetch('/api/admin/clients')
    clients.value = (res as any).data || []
  } catch (error) {
    console.error('Failed to load clients:', error)
  } finally {
    loading.value = false
  }
}

function closeModal() {
  showCreateModal.value = false
  showEditModal.value = false
  form.value = {
    clientName: '',
    redirectUris: '',
    clientType: 'public',
    accessControlEnabled: false
  }
  editingClient.value = null
}

function editClient(client: any) {
  editingClient.value = client
  form.value = {
    clientName: client.name || '',
    redirectUris: (client.redirectUris || []).join('\n'),
    clientType: client.clientSecretHash ? 'confidential' : 'public',
    accessControlEnabled: client.requireAccessGrant || false
  }
  showEditModal.value = true
}

function confirmDelete(client: any) {
  clientToDelete.value = client
  showDeleteModal.value = true
}

async function createClient() {
  saving.value = true
  try {
    const response = await $fetch('/api/admin/clients', {
      method: 'POST',
      body: {
        clientName: form.value.clientName,
        redirectUris: form.value.redirectUris.split('\n').filter(u => u.trim()),
        tokenEndpointAuthMethod: form.value.clientType === 'public' ? 'none' : 'client_secret_basic',
        accessControlEnabled: form.value.accessControlEnabled
      }
    }) as any
    closeModal()
    await loadClients()
    
    // Show secret dialog
    if (response?.client) {
      createdClient.value = response.client
      showSecret.value = false
      showSecretModal.value = true
    }
  } catch (error) {
    console.error('Failed to create client:', error)
    showToast('Failed to create client: ' + ((error as any)?.data?.message || 'Unknown error'), 'error')
  } finally {
    saving.value = false
  }
}

function closeSecretModal() {
  showSecretModal.value = false
  createdClient.value = null
  showSecret.value = false
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    showToast('Copied to clipboard!', 'success')
  } catch (error) {
    console.error('Failed to copy:', error)
    showToast('Failed to copy to clipboard', 'error')
  }
}

async function updateClient() {
  if (!editingClient.value) return
  saving.value = true
  try {
    await $fetch(`/api/admin/clients/${editingClient.value.id}`, {
      method: 'PUT',
      body: {
        clientName: form.value.clientName,
        redirectUris: form.value.redirectUris.split('\n').filter(u => u.trim()),
        clientType: form.value.clientType,
        accessControlEnabled: form.value.accessControlEnabled
      }
    })
    closeModal()
    await loadClients()
  } catch (error) {
    console.error('Failed to update client:', error)
  } finally {
    saving.value = false
  }
}

async function deleteClient() {
  if (!clientToDelete.value) return
  deleting.value = true
  try {
    await $fetch(`/api/admin/clients/${clientToDelete.value.id}`, {
      method: 'DELETE'
    })
    showDeleteModal.value = false
    clientToDelete.value = null
    await loadClients()
  } catch (error) {
    console.error('Failed to delete client:', error)
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  loadClients()
})
</script>
