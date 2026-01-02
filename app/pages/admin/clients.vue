<template>
  <NuxtLayout name="admin">
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">OIDC Clients</h1>
          <p class="text-sm text-gray-500 mt-1">Manage OAuth/OIDC client applications</p>
        </div>
        <UButton
          @click="showCreateModal = true"
          color="primary"
          icon="i-lucide-plus"
        >
          New Client
        </UButton>
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
        <UButton
          @click="showCreateModal = true"
          color="primary"
        >
          Create Client
        </UButton>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="client in clients"
          :key="client.id"
          class="group bg-white rounded-xl border border-gray-200 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300 flex flex-col"
        >
          <!-- Card Header -->
          <div class="p-6 pb-4 flex items-start justify-between gap-4">
            <div class="flex items-center gap-4">
              <div 
                class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                :class="client.isActive ? 'bg-primary-50 text-primary-600' : 'bg-gray-100 text-gray-500'"
              >
                <UIcon 
                  name="i-lucide-box" 
                  class="w-6 h-6" 
                />
              </div>
              <div class="min-w-0">
                <h3 class="font-bold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                  {{ client.name || client.clientId }}
                </h3>
                <div class="flex items-center gap-2 mt-1">
                  <UBadge 
                    :color="client.clientSecretHash ? 'primary' : 'neutral'" 
                    variant="subtle"
                    size="xs"
                  >
                    {{ client.clientSecretHash ? 'Confidential' : 'Public' }}
                  </UBadge>
                  <UBadge
                    :color="client.isActive ? 'primary' : 'neutral'"
                    variant="subtle"
                    size="xs"
                    class="capitalize"
                  >
                    {{ client.isActive ? 'Active' : 'Inactive' }}
                  </UBadge>
                </div>
              </div>
            </div>
            
            <div class="flex gap-1">
              <UButton
                @click="editClient(client)"
                variant="ghost"
                color="neutral"
                icon="i-lucide-settings-2"
                size="sm"
                title="Edit Configuration"
              />
              <UButton
                @click="confirmDelete(client)"
                variant="ghost"
                color="error"
                icon="i-lucide-trash-2"
                size="sm"
                title="Delete Client"
              />
            </div>
          </div>

          <!-- Card Body -->
          <div class="px-6 py-4 border-t border-gray-100 flex-1 space-y-3">
            <div>
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Client ID</p>
              <div class="flex items-center gap-2 group/id">
                <code class="text-sm bg-gray-50 px-2 py-1 rounded border border-gray-100 text-gray-700 truncate font-mono">
                  {{ client.clientId }}
                </code>
                <UButton
                  @click="copyToClipboard(client.clientId)"
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  icon="i-lucide-copy"
                  class="opacity-0 group-hover/id:opacity-100 transition-opacity"
                />
              </div>
            </div>
            
            <div>
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Redirect URIs</p>
              <div class="text-sm text-gray-600">
                <div v-if="client.redirectUris?.length" class="flex flex-col gap-1">
                  <div class="flex items-center gap-2 text-gray-700">
                    <UIcon name="i-lucide-arrow-right-circle" class="size-4 shrink-0 text-gray-400" />
                    <span class="truncate">{{ client.redirectUris[0] }}</span>
                  </div>
                  <span v-if="client.redirectUris.length > 1" class="text-xs text-gray-400 pl-6">
                    +{{ client.redirectUris.length - 1 }} more URIs
                  </span>
                </div>
                <span v-else class="text-gray-400 italic">No redirect URIs configured</span>
              </div>
            </div>

            <!-- Access Control Toggle -->
            <div class="pt-2 border-t border-gray-100">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium text-gray-700">Access Control</p>
                  <p class="text-xs text-gray-500 mt-0.5">
                    {{ client.requireAccessGrant ? 'Restricted access' : 'Open to all users' }}
                  </p>
                </div>
                <USwitch
                  :model-value="client.requireAccessGrant"
                  @update:model-value="toggleAccessControl(client)"
                  size="sm"
                  :color="client.requireAccessGrant ? 'primary' : 'neutral'"
                />
              </div>
            </div>
          </div>

          <!-- Card Footer -->
          <div class="px-6 py-3 bg-gray-50/50 border-t border-gray-100 rounded-b-xl flex justify-between items-center">
             <div class="text-xs text-gray-400 flex items-center gap-1">
               <UIcon name="i-lucide-clock" class="size-3" />
               Updated {{ new Date(client.updatedAt).toLocaleDateString() }}
             </div>
             <USwitch
               :model-value="client.isActive"
               @update:model-value="toggleStatus(client)"
               size="md"
               color="primary"
             />
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
              <UInput
                v-model="form.clientName"
                placeholder="My Application"
                required
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Redirect URIs (one per line)</label>
              <UTextarea
                v-model="form.redirectUris"
                :rows="3"
                placeholder="https://myapp.com/callback"
                required
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Client Type</label>
              <USelect
                v-model="form.clientType"
                :items="clientTypeOptions"
                class="w-full"
              />
            </div>
            <UCheckbox
              v-model="form.accessControlEnabled"
              label="Enable Access Control"
              class="mb-2"
            />
            <UCheckbox
              v-model="form.isActive"
              label="Active"
            />
            <div class="flex gap-3 pt-4">
              <UButton
                type="button"
                @click="closeModal"
                variant="outline"
                color="neutral"
                class="flex-1"
              >
                Cancel
              </UButton>
              <UButton
                type="submit"
                :disabled="saving"
                :loading="saving"
                color="primary"
                class="flex-1"
              >
                {{ showEditModal ? 'Update' : 'Create' }}
              </UButton>
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
              <UButton
                @click="showDeleteModal = false"
                variant="outline"
                color="neutral"
                class="flex-1"
              >
                Cancel
              </UButton>
              <UButton
                @click="deleteClient"
                :disabled="deleting"
                :loading="deleting"
                color="error"
                class="flex-1"
              >
                Delete
              </UButton>
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
            <UButton
              @click="closeSecretModal"
              color="primary"
              class="w-full"
            >
              I've saved the credentials
            </UButton>
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
  accessControlEnabled: false,
  isActive: true
})

// Client type options for USelect
const clientTypeOptions = [
  { label: 'Public', value: 'public' },
  { label: 'Confidential', value: 'confidential' }
]

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
    accessControlEnabled: false,
    isActive: true
  }
  editingClient.value = null
}

function editClient(client: any) {
  editingClient.value = client
  form.value = {
    clientName: client.name || '',
    redirectUris: (client.redirectUris || []).join('\n'),
    clientType: client.clientSecretHash ? 'confidential' : 'public',
    accessControlEnabled: client.requireAccessGrant || false,
    isActive: client.isActive
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
        accessControlEnabled: form.value.accessControlEnabled,
        isActive: form.value.isActive
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
        accessControlEnabled: form.value.accessControlEnabled,
        isActive: form.value.isActive
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

async function toggleStatus(client: any) {
  // Optimistic update
  const originalStatus = client.isActive
  client.isActive = !client.isActive

  try {
    await $fetch(`/api/admin/clients/${client.id}`, {
      method: 'PUT',
      body: {
        isActive: client.isActive
      }
    })
    showToast(client.isActive ? 'Client activated' : 'Client deactivated', 'success')
  } catch (error) {
    // Revert on error
    client.isActive = originalStatus
    console.error('Failed to update status:', error)
    showToast('Failed to update status', 'error')
  }
}

async function toggleAccessControl(client: any) {
  // Optimistic update
  const originalValue = client.requireAccessGrant
  client.requireAccessGrant = !client.requireAccessGrant

  try {
    await $fetch(`/api/admin/clients/${client.id}`, {
      method: 'PUT',
      body: {
        requireAccessGrant: client.requireAccessGrant
      }
    })
    
    const message = client.requireAccessGrant 
      ? 'Access control enabled - only granted users can access this app'
      : 'Access control disabled - all users can access this app'
    
    showToast(message, 'success')
  } catch (error) {
    // Revert on error
    client.requireAccessGrant = originalValue
    console.error('Failed to update access control:', error)
    showToast('Failed to update access control', 'error')
  }
}

onMounted(() => {
  loadClients()
})
</script>
