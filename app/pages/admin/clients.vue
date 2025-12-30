<template>
  <NuxtLayout name="admin">
    <div>
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">OIDC Clients</h1>
        <button @click="openCreateModal" class="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Client
        </button>
      </div>

      <!-- Clients Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="client in clients"
          :key="client.id"
          class="card bg-base-100 shadow"
        >
          <div class="card-body">
            <div class="flex justify-between items-start">
              <h2 class="card-title">{{ client.name }}</h2>
              <span
                class="badge"
                :class="client.isActive ? 'badge-success' : 'badge-error'"
              >
                {{ client.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>
            <p class="text-sm text-base-content/60">{{ client.description || 'No description' }}</p>
            
            <div class="mt-4 space-y-2 text-sm">
              <div>
                <span class="font-medium">Client ID:</span>
                <code class="ml-2 bg-base-200 px-2 py-0.5 rounded text-xs">{{ client.clientId }}</code>
              </div>
              <div>
                <span class="font-medium">Auth Method:</span>
                <span class="ml-2">{{ client.tokenEndpointAuthMethod }}</span>
              </div>
              <div>
                <span class="font-medium">Scopes:</span>
                <div class="flex gap-1 flex-wrap mt-1">
                  <span v-for="scope in client.scopes" :key="scope" class="badge badge-outline badge-xs">
                    {{ scope }}
                  </span>
                </div>
              </div>
            </div>

            <div class="card-actions justify-end mt-4">
              <button @click="editClient(client)" class="btn btn-sm btn-ghost">Edit</button>
              <button @click="confirmDelete(client)" class="btn btn-sm btn-error btn-outline">Delete</button>
            </div>
          </div>
        </div>

        <div v-if="clients.length === 0 && !loading" class="col-span-full">
          <div class="text-center py-12 text-base-content/50">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p>No OIDC clients registered yet</p>
            <button @click="openCreateModal" class="btn btn-primary mt-4">Register First Client</button>
          </div>
        </div>

        <div v-if="loading" class="col-span-full text-center py-12">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <dialog ref="clientModal" class="modal">
        <div class="modal-box w-11/12 max-w-3xl">
          <h3 class="font-bold text-lg mb-6">{{ isEditing ? 'Edit Client' : 'New OIDC Client' }}</h3>
          
          <form @submit.prevent="saveClient">
            <div class="space-y-6">
              <!-- Basic Info Section -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium">Name <span class="text-error">*</span></span>
                  </label>
                  <input v-model="form.name" type="text" class="input input-bordered w-full" required />
                </div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium">Description</span>
                  </label>
                  <input v-model="form.description" type="text" class="input input-bordered w-full" />
                </div>
              </div>

              <!-- Redirect URIs Section -->
              <div class="divider my-2"></div>
              
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Redirect URIs <span class="text-error">*</span></span>
                  <span class="label-text-alt text-base-content/60">(one per line)</span>
                </label>
                <textarea
                  v-model="form.redirectUrisText"
                  class="textarea textarea-bordered h-24 w-full font-mono text-sm"
                  placeholder="https://app.example.com/callback"
                  required
                ></textarea>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Post Logout Redirect URIs</span>
                  <span class="label-text-alt text-base-content/60">(one per line)</span>
                </label>
                <textarea
                  v-model="form.postLogoutRedirectUrisText"
                  class="textarea textarea-bordered h-20 w-full font-mono text-sm"
                  placeholder="https://app.example.com"
                ></textarea>
              </div>

              <!-- Configuration Section -->
              <div class="divider my-2"></div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium">Scopes</span>
                  </label>
                  <div class="space-y-2">
                    <label v-for="scope in availableScopes" :key="scope" class="flex items-center gap-3 cursor-pointer hover:bg-base-200 p-2 rounded">
                      <input
                        type="checkbox"
                        :value="scope"
                        v-model="form.scopes"
                        class="checkbox checkbox-sm checkbox-primary"
                      />
                      <span class="label-text">{{ scope }}</span>
                    </label>
                  </div>
                </div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium">Token Auth Method</span>
                  </label>
                  <select v-model="form.tokenEndpointAuthMethod" class="select select-bordered w-full">
                    <option value="client_secret_basic">Client Secret Basic</option>
                    <option value="client_secret_post">Client Secret Post</option>
                    <option value="none">None (Public Client)</option>
                  </select>
                  
                  <div class="mt-4 space-y-3">
                    <label class="flex items-center gap-3 cursor-pointer hover:bg-base-200 p-2 rounded">
                      <input type="checkbox" v-model="form.isFirstParty" class="checkbox checkbox-sm checkbox-primary" />
                      <span class="label-text">First-party app (auto-approve consent)</span>
                    </label>

                    <label v-if="isEditing" class="flex items-center gap-3 cursor-pointer hover:bg-base-200 p-2 rounded">
                      <input type="checkbox" v-model="form.isActive" class="checkbox checkbox-sm checkbox-primary" />
                      <span class="label-text">Active</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-action mt-8">
              <button type="button" class="btn btn-ghost" @click="closeModal">Cancel</button>
              <button type="submit" class="btn btn-primary min-w-24" :disabled="saving">
                <span v-if="saving" class="loading loading-spinner loading-sm"></span>
                {{ saving ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      <!-- Created Client Modal (show secret) -->
      <dialog ref="createdModal" class="modal">
        <div class="modal-box">
          <h3 class="font-bold text-lg text-success">Client Created Successfully!</h3>
          <div class="py-4">
            <div class="alert alert-warning mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Save the client secret now! It will not be shown again.</span>
            </div>
            <div class="space-y-3">
              <div>
                <label class="text-sm font-medium">Client ID:</label>
                <code class="block bg-base-200 p-2 rounded mt-1 break-all">{{ createdClient.clientId }}</code>
              </div>
              <div v-if="createdClient.clientSecret">
                <label class="text-sm font-medium">Client Secret:</label>
                <code class="block bg-base-200 p-2 rounded mt-1 break-all text-error">{{ createdClient.clientSecret }}</code>
              </div>
            </div>
          </div>
          <div class="modal-action">
            <button class="btn btn-primary" @click="closeCreatedModal">I've saved the secret</button>
          </div>
        </div>
      </dialog>

      <!-- Delete Confirmation -->
      <dialog ref="deleteModal" class="modal">
        <div class="modal-box">
          <h3 class="font-bold text-lg">Delete Client</h3>
          <p class="py-4">Are you sure you want to delete <strong>{{ clientToDelete?.name }}</strong>? This action cannot be undone.</p>
          <div class="modal-action">
            <button class="btn" @click="closeDeleteModal">Cancel</button>
            <button class="btn btn-error" @click="deleteClient" :disabled="deleting">
              <span v-if="deleting" class="loading loading-spinner loading-sm"></span>
              Delete
            </button>
          </div>
        </div>
      </dialog>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: false
})

interface Client {
  id: string
  clientId: string
  name: string
  description: string | null
  redirectUris: string[]
  postLogoutRedirectUris: string[]
  grantTypes: string[]
  responseTypes: string[]
  scopes: string[]
  tokenEndpointAuthMethod: string
  isFirstParty: boolean
  isActive: boolean
}

const clients = ref<Client[]>([])
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)

const clientModal = ref<HTMLDialogElement>()
const createdModal = ref<HTMLDialogElement>()
const deleteModal = ref<HTMLDialogElement>()

const availableScopes = ['openid', 'profile', 'email', 'roles', 'offline_access']

const form = ref({
  name: '',
  description: '',
  redirectUrisText: '',
  postLogoutRedirectUrisText: '',
  scopes: ['openid', 'profile', 'email'],
  tokenEndpointAuthMethod: 'client_secret_basic',
  isFirstParty: false,
  isActive: true
})

const createdClient = ref({ clientId: '', clientSecret: '' })
const clientToDelete = ref<Client | null>(null)

onMounted(() => {
  loadClients()
})

async function loadClients() {
  loading.value = true
  try {
    const res = await $fetch('/api/admin/clients')
    clients.value = res.data
  } catch (e) {
    console.error('Failed to load clients:', e)
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  isEditing.value = false
  editingId.value = null
  form.value = {
    name: '',
    description: '',
    redirectUrisText: '',
    postLogoutRedirectUrisText: '',
    scopes: ['openid', 'profile', 'email'],
    tokenEndpointAuthMethod: 'client_secret_basic',
    isFirstParty: false,
    isActive: true
  }
  clientModal.value?.showModal()
}

function editClient(client: Client) {
  isEditing.value = true
  editingId.value = client.id
  form.value = {
    name: client.name,
    description: client.description || '',
    redirectUrisText: client.redirectUris.join('\n'),
    postLogoutRedirectUrisText: (client.postLogoutRedirectUris || []).join('\n'),
    scopes: [...client.scopes],
    tokenEndpointAuthMethod: client.tokenEndpointAuthMethod,
    isFirstParty: client.isFirstParty,
    isActive: client.isActive
  }
  clientModal.value?.showModal()
}

function closeModal() {
  clientModal.value?.close()
}

async function saveClient() {
  saving.value = true
  try {
    const data = {
      name: form.value.name,
      description: form.value.description || null,
      redirectUris: form.value.redirectUrisText.split('\n').map(u => u.trim()).filter(Boolean),
      postLogoutRedirectUris: form.value.postLogoutRedirectUrisText.split('\n').map(u => u.trim()).filter(Boolean),
      scopes: form.value.scopes,
      tokenEndpointAuthMethod: form.value.tokenEndpointAuthMethod,
      isFirstParty: form.value.isFirstParty,
      isActive: form.value.isActive
    }

    if (isEditing.value && editingId.value) {
      await $fetch(`/api/admin/clients/${editingId.value}`, {
        method: 'PUT',
        body: data
      })
    } else {
      const res = await $fetch('/api/admin/clients', {
        method: 'POST',
        body: data
      })
      // Show the created client with secret
      createdClient.value = {
        clientId: res.client.clientId,
        clientSecret: res.client.clientSecret || ''
      }
      createdModal.value?.showModal()
    }

    closeModal()
    await loadClients()
  } catch (e: any) {
    console.error('Failed to save client:', e)
    alert(e.data?.message || 'Failed to save client')
  } finally {
    saving.value = false
  }
}

function closeCreatedModal() {
  createdModal.value?.close()
}

function confirmDelete(client: Client) {
  clientToDelete.value = client
  deleteModal.value?.showModal()
}

function closeDeleteModal() {
  deleteModal.value?.close()
  clientToDelete.value = null
}

async function deleteClient() {
  if (!clientToDelete.value) return
  
  deleting.value = true
  try {
    await $fetch(`/api/admin/clients/${clientToDelete.value.id}`, {
      method: 'DELETE'
    })
    closeDeleteModal()
    await loadClients()
  } catch (e: any) {
    console.error('Failed to delete client:', e)
    alert(e.data?.message || 'Failed to delete client')
  } finally {
    deleting.value = false
  }
}
</script>
