<template>
  <NuxtLayout name="admin">
    <div>
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold">User App Access</h1>
          <p class="text-base-content/60 text-sm mt-1">Atur user mana yang boleh mengakses aplikasi tertentu</p>
        </div>
        <button @click="openGrantModal" class="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Grant Access
        </button>
      </div>

      <!-- Filter by App -->
      <div class="flex gap-4 mb-6">
        <select v-model="selectedClientId" class="select select-bordered w-64" @change="loadAccessGrants">
          <option value="">Semua Aplikasi</option>
          <option v-for="client in clients" :key="client.id" :value="client.id">
            {{ client.name }}
            <span v-if="client.requireAccessGrant">(🔒)</span>
          </option>
        </select>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari user..."
          class="input input-bordered flex-1"
          @input="filterGrants"
        />
      </div>

      <!-- Apps with Access Control -->
      <div class="alert alert-info mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p><strong>🔒 Aplikasi dengan Access Control:</strong></p>
          <p class="text-sm">
            {{ accessControlApps.length > 0 ? accessControlApps.map(a => a.name).join(', ') : 'Belum ada aplikasi dengan access control' }}
          </p>
        </div>
      </div>

      <!-- Access Grants Table -->
      <div class="card bg-base-100 shadow">
        <div class="card-body p-0">
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Aplikasi</th>
                  <th>Status</th>
                  <th>Granted At</th>
                  <th>Expires</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="grant in filteredGrants" :key="grant.id">
                  <td>
                    <div class="font-semibold">{{ grant.userName }}</div>
                  </td>
                  <td class="text-sm">{{ grant.userEmail }}</td>
                  <td class="text-sm">{{ grant.userDepartment || '-' }}</td>
                  <td>
                    <span class="badge badge-outline">{{ grant.clientName }}</span>
                  </td>
                  <td>
                    <span 
                      class="badge" 
                      :class="getStatusClass(grant)"
                    >
                      {{ getStatusText(grant) }}
                    </span>
                  </td>
                  <td class="text-sm text-base-content/60">
                    {{ formatDate(grant.grantedAt) }}
                  </td>
                  <td class="text-sm">
                    <span v-if="grant.expiresAt" :class="isExpired(grant.expiresAt) ? 'text-error' : ''">
                      {{ formatDate(grant.expiresAt) }}
                    </span>
                    <span v-else class="text-base-content/40">Never</span>
                  </td>
                  <td>
                    <button 
                      @click="revokeAccess(grant)" 
                      class="btn btn-ghost btn-xs text-error"
                      :disabled="revoking === grant.id"
                    >
                      <span v-if="revoking === grant.id" class="loading loading-spinner loading-xs"></span>
                      <span v-else>Revoke</span>
                    </button>
                  </td>
                </tr>
                <tr v-if="filteredGrants.length === 0 && !loading">
                  <td colspan="8" class="text-center py-8 text-base-content/50">
                    Belum ada access grant
                  </td>
                </tr>
                <tr v-if="loading">
                  <td colspan="8" class="text-center py-8">
                    <span class="loading loading-spinner loading-lg"></span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Grant Access Modal -->
      <dialog ref="grantModal" class="modal">
        <div class="modal-box w-11/12 max-w-3xl">
          <h3 class="font-bold text-lg mb-4">Grant User Access</h3>
          
          <form @submit.prevent="submitGrant">
            <!-- Select App -->
            <div class="form-control mb-4">
              <label class="label">
                <span class="label-text">Aplikasi</span>
              </label>
              <select v-model="grantForm.clientId" class="select select-bordered" required>
                <option value="">Pilih Aplikasi</option>
                <option v-for="client in clients" :key="client.id" :value="client.id">
                  {{ client.name }}
                  <span v-if="!client.requireAccessGrant"> (open access)</span>
                </option>
              </select>
            </div>

            <!-- Select Users -->
            <div class="form-control mb-4">
              <label class="label">
                <span class="label-text">Cari & Pilih User</span>
              </label>
              <input
                v-model="userSearchQuery"
                type="text"
                placeholder="Ketik nama atau email..."
                class="input input-bordered"
                @input="searchUsers"
              />
              
              <!-- User Search Results -->
              <div v-if="userSearchResults.length > 0" class="mt-2 border rounded-lg max-h-48 overflow-y-auto">
                <div
                  v-for="user in userSearchResults"
                  :key="user.id"
                  class="p-2 hover:bg-base-200 cursor-pointer flex justify-between items-center"
                  @click="addUserToSelection(user)"
                >
                  <div>
                    <div class="font-semibold">{{ user.name }}</div>
                    <div class="text-sm text-base-content/60">{{ user.email }}</div>
                  </div>
                  <span v-if="isUserSelected(user.id)" class="text-success">✓</span>
                </div>
              </div>

              <!-- Selected Users -->
              <div v-if="grantForm.selectedUsers.length > 0" class="mt-3">
                <label class="label">
                  <span class="label-text">User yang dipilih ({{ grantForm.selectedUsers.length }})</span>
                </label>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="user in grantForm.selectedUsers"
                    :key="user.id"
                    class="badge badge-lg gap-1"
                  >
                    {{ user.name }}
                    <button type="button" @click="removeUserFromSelection(user.id)" class="btn btn-ghost btn-xs">×</button>
                  </span>
                </div>
              </div>
            </div>

            <!-- Expiration -->
            <div class="form-control mb-4">
              <label class="label">
                <span class="label-text">Expires At (Optional)</span>
              </label>
              <input
                v-model="grantForm.expiresAt"
                type="date"
                class="input input-bordered"
              />
            </div>

            <!-- Notes -->
            <div class="form-control mb-4">
              <label class="label">
                <span class="label-text">Catatan (Optional)</span>
              </label>
              <textarea
                v-model="grantForm.notes"
                class="textarea textarea-bordered"
                placeholder="Alasan pemberian akses..."
              ></textarea>
            </div>

            <div class="modal-action">
              <button type="button" class="btn btn-ghost" @click="closeGrantModal">Batal</button>
              <button 
                type="submit" 
                class="btn btn-primary"
                :disabled="!grantForm.clientId || grantForm.selectedUsers.length === 0 || submitting"
              >
                <span v-if="submitting" class="loading loading-spinner loading-sm"></span>
                <span v-else>Grant Access ({{ grantForm.selectedUsers.length }})</span>
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface AccessGrant {
  id: string
  userId: string
  clientId: string
  userName: string
  userEmail: string
  userDepartment: string | null
  clientName: string
  clientDescription: string | null
  isActive: boolean
  grantedAt: string
  expiresAt: string | null
  notes: string | null
}

interface Client {
  id: string
  clientId: string
  name: string
  description: string | null
  requireAccessGrant: boolean
  isActive: boolean
}

interface User {
  id: string
  name: string
  email: string
  department: string | null
}

const loading = ref(false)
const submitting = ref(false)
const revoking = ref<string | null>(null)

const grants = ref<AccessGrant[]>([])
const clients = ref<Client[]>([])
const selectedClientId = ref('')
const searchQuery = ref('')

const grantModal = ref<HTMLDialogElement | null>(null)
const userSearchQuery = ref('')
const userSearchResults = ref<User[]>([])

const grantForm = ref({
  clientId: '',
  selectedUsers: [] as User[],
  expiresAt: '',
  notes: ''
})

// Computed
const accessControlApps = computed(() => 
  clients.value.filter(c => c.requireAccessGrant)
)

const filteredGrants = computed(() => {
  let result = grants.value
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(g => 
      g.userName?.toLowerCase().includes(q) ||
      g.userEmail?.toLowerCase().includes(q) ||
      g.userDepartment?.toLowerCase().includes(q)
    )
  }
  
  return result
})

// Methods
function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function isExpired(dateStr: string) {
  return new Date(dateStr) < new Date()
}

function getStatusClass(grant: AccessGrant) {
  if (!grant.isActive) return 'badge-error'
  if (grant.expiresAt && isExpired(grant.expiresAt)) return 'badge-warning'
  return 'badge-success'
}

function getStatusText(grant: AccessGrant) {
  if (!grant.isActive) return 'Revoked'
  if (grant.expiresAt && isExpired(grant.expiresAt)) return 'Expired'
  return 'Active'
}

async function loadClients() {
  try {
    const res = await fetch('/api/admin/clients')
    const data = await res.json()
    clients.value = data.data || []
  } catch (error) {
    console.error('Failed to load clients:', error)
  }
}

async function loadAccessGrants() {
  loading.value = true
  try {
    let url = '/api/admin/user-access'
    if (selectedClientId.value) {
      url += `?clientId=${selectedClientId.value}`
    }
    const res = await fetch(url)
    const data = await res.json()
    grants.value = data.data || []
  } catch (error) {
    console.error('Failed to load access grants:', error)
  } finally {
    loading.value = false
  }
}

function filterGrants() {
  // Computed property handles filtering
}

function openGrantModal() {
  grantForm.value = {
    clientId: selectedClientId.value || '',
    selectedUsers: [],
    expiresAt: '',
    notes: ''
  }
  userSearchQuery.value = ''
  userSearchResults.value = []
  grantModal.value?.showModal()
}

function closeGrantModal() {
  grantModal.value?.close()
}

let searchTimeout: NodeJS.Timeout | null = null
async function searchUsers() {
  if (searchTimeout) clearTimeout(searchTimeout)
  
  if (userSearchQuery.value.length < 2) {
    userSearchResults.value = []
    return
  }
  
  searchTimeout = setTimeout(async () => {
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(userSearchQuery.value)}&limit=10`)
      const data = await res.json()
      userSearchResults.value = data.data || []
    } catch (error) {
      console.error('Failed to search users:', error)
    }
  }, 300)
}

function isUserSelected(userId: string) {
  return grantForm.value.selectedUsers.some(u => u.id === userId)
}

function addUserToSelection(user: User) {
  if (!isUserSelected(user.id)) {
    grantForm.value.selectedUsers.push(user)
  }
  userSearchQuery.value = ''
  userSearchResults.value = []
}

function removeUserFromSelection(userId: string) {
  grantForm.value.selectedUsers = grantForm.value.selectedUsers.filter(u => u.id !== userId)
}

async function submitGrant() {
  if (!grantForm.value.clientId || grantForm.value.selectedUsers.length === 0) return
  
  submitting.value = true
  try {
    const userIds = grantForm.value.selectedUsers.map(u => u.id)
    
    const res = await fetch('/api/admin/user-access/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userIds,
        clientId: grantForm.value.clientId,
        expiresAt: grantForm.value.expiresAt || null,
        notes: grantForm.value.notes || null
      })
    })
    
    const data = await res.json()
    
    if (data.success) {
      closeGrantModal()
      await loadAccessGrants()
      alert(`✅ ${data.message}`)
    } else {
      alert(`❌ Error: ${data.message}`)
    }
  } catch (error: any) {
    console.error('Failed to grant access:', error)
    alert(`❌ Error: ${error.message}`)
  } finally {
    submitting.value = false
  }
}

async function revokeAccess(grant: AccessGrant) {
  if (!confirm(`Revoke access untuk ${grant.userName} dari ${grant.clientName}?`)) return
  
  revoking.value = grant.id
  try {
    const res = await fetch(`/api/admin/user-access/${grant.id}`, {
      method: 'DELETE'
    })
    
    const data = await res.json()
    
    if (data.success) {
      await loadAccessGrants()
    } else {
      alert(`❌ Error: ${data.message}`)
    }
  } catch (error: any) {
    console.error('Failed to revoke access:', error)
    alert(`❌ Error: ${error.message}`)
  } finally {
    revoking.value = null
  }
}

onMounted(async () => {
  await loadClients()
  await loadAccessGrants()
})
</script>
