<template>
  <NuxtLayout name="admin">
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">Roles & Permissions</h1>
          <p class="text-sm text-gray-500 mt-1">Kelola role dan hak akses pengguna</p>
        </div>
        <UButton
          @click="showCreateModal = true"
          color="primary"
          icon="i-lucide-plus"
        >
          Tambah Role
        </UButton>
      </div>

      <!-- Roles Grid -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="i in 3" :key="i" class="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div class="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div class="h-3 bg-gray-200 rounded w-full"></div>
        </div>
      </div>

      <div v-else-if="roles.length === 0" class="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <svg class="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Belum ada role</h3>
        <p class="text-gray-500 mb-4">Buat role pertama untuk mengatur hak akses</p>
        <UButton
          @click="showCreateModal = true"
          color="primary"
        >
          Buat Role
        </UButton>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="role in roles"
          :key="role.id"
          class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div :class="[
                'w-10 h-10 rounded-lg flex items-center justify-center',
                role.isSystem ? 'bg-purple-100' : 'bg-blue-100'
              ]">
                <svg :class="[
                  'w-5 h-5',
                  role.isSystem ? 'text-purple-600' : 'text-blue-600'
                ]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900">{{ role.name }}</h3>
                <p class="text-xs text-gray-500">
                  {{ role.siteName || 'Global' }}
                  <span v-if="role.isSystem" class="ml-1 text-purple-600">(Sistem)</span>
                </p>
              </div>
            </div>
            <div v-if="!role.isSystem" class="flex items-center gap-1">
              <UButton
                @click="editRole(role)"
                variant="ghost"
                color="neutral"
                icon="i-lucide-pencil"
                size="xs"
              />
              <UButton
                @click="confirmDelete(role)"
                variant="ghost"
                color="error"
                icon="i-lucide-trash-2"
                size="xs"
              />
            </div>
          </div>
          
          <p v-if="role.description" class="text-sm text-gray-600 mb-3">{{ role.description }}</p>
          
          <!-- User count and manage button -->
          <div class="flex items-center justify-between mb-3 py-2 px-3 bg-gray-50 rounded-lg">
            <span class="text-sm text-gray-600">
              <span class="font-medium">{{ role.userCount || 0 }}</span> user
            </span>
            <UButton
              @click="openUsersModal(role)"
              variant="ghost"
              color="primary"
              icon="i-lucide-users"
              size="xs"
            >
              Kelola User
            </UButton>
          </div>
          
          <div class="flex flex-wrap gap-1">
            <span 
              v-for="perm in (role.permissions || []).slice(0, 5)" 
              :key="perm"
              class="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
            >
              {{ formatPermission(perm) }}
            </span>
            <span 
              v-if="(role.permissions || []).length > 5"
              class="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
            >
              +{{ (role.permissions || []).length - 5 }} lainnya
            </span>
          </div>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div v-if="showCreateModal || showEditModal" class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="fixed inset-0 bg-black/50" @click="closeModal"></div>
          <div class="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900">
                {{ showEditModal ? 'Edit Role' : 'Tambah Role Baru' }}
              </h3>
            </div>
            
            <div class="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nama Role *</label>
                <UInput
                  v-model="form.name"
                  placeholder="Contoh: Admin Site"
                  class="w-full"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <UTextarea
                  v-model="form.description"
                  :rows="2"
                  placeholder="Deskripsi role ini..."
                  class="w-full"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Site (opsional)</label>
                <USelect
                  v-model="form.siteId"
                  :items="siteOptions"
                  placeholder="Global (Semua Site)"
                  class="w-full"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
                
                <div class="space-y-4">
                  <div v-for="category in permissionCategories" :key="category.name" class="border border-gray-200 rounded-lg p-4">
                    <div class="flex items-center justify-between mb-3">
                      <h4 class="font-medium text-gray-900 capitalize">{{ category.name }}</h4>
                      <button
                        @click="toggleCategory(category.name)"
                        class="text-xs text-emerald-600 hover:text-emerald-700"
                      >
                        {{ isCategoryFullySelected(category.name) ? 'Hapus Semua' : 'Pilih Semua' }}
                      </button>
                    </div>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <UCheckbox
                        v-for="perm in category.permissions"
                        :key="perm.value"
                        :model-value="form.permissions.includes(perm.value)"
                        @update:model-value="(val) => val ? form.permissions.push(perm.value) : form.permissions = form.permissions.filter(p => p !== perm.value)"
                        :label="perm.action"
                        class="capitalize"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <UButton
                @click="closeModal"
                variant="outline"
                color="neutral"
              >
                Batal
              </UButton>
              <UButton
                @click="showEditModal ? updateRole() : createRole()"
                :disabled="saving"
                :loading="saving"
                color="primary"
              >
                {{ showEditModal ? 'Simpan Perubahan' : 'Buat Role' }}
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <ConfirmModal
        :isOpen="showDeleteModal"
        title="Hapus Role"
        :message="`Apakah Anda yakin ingin menghapus role '${roleToDelete?.name}'? Tindakan ini tidak dapat dibatalkan.`"
        type="danger"
        confirmText="Hapus"
        cancelText="Batal"
        @confirm="deleteRole"
        @cancel="showDeleteModal = false"
      />

      <!-- Error Modal -->
      <ConfirmModal
        :isOpen="showErrorModal"
        title="Error"
        :message="errorMessage"
        type="warning"
        confirmText="OK"
        @confirm="showErrorModal = false"
        @cancel="showErrorModal = false"
      />

      <!-- Manage Users Modal -->
      <div v-if="showUsersModal" class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen px-4">
          <div class="fixed inset-0 bg-black/50" @click="closeUsersModal"></div>
          <div class="relative bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900">Kelola User</h3>
              <p class="text-sm text-gray-500">
                Role: <strong>{{ usersRole?.name }}</strong>
              </p>
            </div>
            
            <div v-if="loadingUsers" class="p-6 text-center text-gray-500">
              <svg class="animate-spin h-6 w-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Memuat users...
            </div>
            
            <div v-else class="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <!-- Current Users -->
              <div>
                <h4 class="text-sm font-medium text-gray-700 mb-2">User dengan role ini ({{ roleUsers.length }})</h4>
                <div v-if="roleUsers.length === 0" class="text-sm text-gray-400 py-2">
                  Belum ada user dengan role ini
                </div>
                <div v-else class="space-y-2">
                  <div
                    v-for="user in roleUsers"
                    :key="user.id"
                    class="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50"
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span class="text-emerald-700 text-sm font-semibold">{{ user.name?.charAt(0).toUpperCase() }}</span>
                      </div>
                      <div>
                        <p class="font-medium text-gray-900 text-sm">{{ user.name }}</p>
                        <p class="text-xs text-gray-500">{{ user.email }}</p>
                      </div>
                    </div>
                    <UButton
                      @click="removeUserFromRole(user)"
                      variant="ghost"
                      color="error"
                      icon="i-lucide-x"
                      size="xs"
                      :loading="savingUser"
                    />
                  </div>
                </div>
              </div>
              
              <!-- Add Users -->
              <div class="border-t border-gray-200 pt-4">
                <h4 class="text-sm font-medium text-gray-700 mb-2">Tambah User</h4>
                <UInput
                  v-model="userSearchQuery"
                  placeholder="Cari user..."
                  icon="i-lucide-search"
                  class="mb-3"
                />
                
                <div v-if="filteredAvailableUsers.length === 0" class="text-sm text-gray-400 py-2">
                  {{ userSearchQuery ? 'Tidak ditemukan user' : 'Semua user sudah memiliki role ini' }}
                </div>
                <div v-else class="space-y-2 max-h-48 overflow-y-auto">
                  <div
                    v-for="user in filteredAvailableUsers"
                    :key="user.id"
                    class="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                    @click="addUserToRole(user)"
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span class="text-blue-700 text-sm font-semibold">{{ user.name?.charAt(0).toUpperCase() }}</span>
                      </div>
                      <div>
                        <p class="font-medium text-gray-900 text-sm">{{ user.name }}</p>
                        <p class="text-xs text-gray-500">{{ user.email }}</p>
                      </div>
                    </div>
                    <UButton
                      variant="ghost"
                      color="primary"
                      icon="i-lucide-plus"
                      size="xs"
                      :loading="savingUser"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div class="px-6 py-4 border-t border-gray-200 flex justify-end">
              <UButton
                @click="closeUsersModal"
                variant="outline"
                color="neutral"
              >
                Selesai
              </UButton>
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

interface Role {
  id: string
  name: string
  description: string | null
  permissions: string[]
  siteId: string | null
  siteName: string | null
  isSystem: boolean
  createdAt: string
  updatedAt: string
  userCount?: number
}

interface RoleUser {
  id: string
  email: string
  name: string
  employeeId: string | null
  status: string
}

interface Site {
  id: string
  name: string
}

interface Permission {
  key: string
  value: string
  category: string
  action: string
}

const roles = ref<Role[]>([])
const sites = ref<Site[]>([])
const availablePermissions = ref<Permission[]>([])
const loading = ref(true)
const saving = ref(false)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showErrorModal = ref(false)
const errorMessage = ref('')
const editingRole = ref<Role | null>(null)
const roleToDelete = ref<Role | null>(null)

// Users management for role
const showUsersModal = ref(false)
const usersRole = ref<Role | null>(null)
const roleUsers = ref<RoleUser[]>([])
const allUsers = ref<RoleUser[]>([])
const loadingUsers = ref(false)
const savingUser = ref(false)
const userSearchQuery = ref('')

const form = ref({
  name: '',
  description: '',
  permissions: [] as string[],
  siteId: null as string | null
})

// Site options for USelect
const siteOptions = computed(() => {
  return [
    { label: 'Global (Semua Site)', value: null },
    ...sites.value.map(s => ({ label: s.name, value: s.id }))
  ]
})

const permissionCategories = computed(() => {
  const categories: Record<string, Permission[]> = {}
  availablePermissions.value.forEach(perm => {
    if (!categories[perm.category]) {
      categories[perm.category] = []
    }
    categories[perm.category].push(perm)
  })
  return Object.entries(categories).map(([name, permissions]) => ({
    name,
    permissions
  }))
})

function isCategoryFullySelected(category: string) {
  const categoryPerms = availablePermissions.value.filter(p => p.category === category)
  return categoryPerms.every(p => form.value.permissions.includes(p.value))
}

function toggleCategory(category: string) {
  const categoryPerms = availablePermissions.value.filter(p => p.category === category)
  const allSelected = isCategoryFullySelected(category)
  
  if (allSelected) {
    form.value.permissions = form.value.permissions.filter(
      p => !categoryPerms.some(cp => cp.value === p)
    )
  } else {
    const toAdd = categoryPerms.filter(p => !form.value.permissions.includes(p.value))
    form.value.permissions.push(...toAdd.map(p => p.value))
  }
}

function formatPermission(perm: string) {
  const parts = perm.split('.')
  return `${parts[0]}: ${parts[1]}`
}

async function loadRoles() {
  loading.value = true
  try {
    const res = await $fetch('/api/admin/roles')
    roles.value = (res as any).data || []
    availablePermissions.value = (res as any).permissions || []
  } catch (error) {
    console.error('Failed to load roles:', error)
  } finally {
    loading.value = false
  }
}

async function loadSites() {
  try {
    const res = await $fetch('/api/admin/sites')
    sites.value = (res as any).sites || []
  } catch (error) {
    console.error('Failed to load sites:', error)
  }
}

function closeModal() {
  showCreateModal.value = false
  showEditModal.value = false
  form.value = {
    name: '',
    description: '',
    permissions: [],
    siteId: null
  }
  editingRole.value = null
}

function editRole(role: Role) {
  editingRole.value = role
  form.value = {
    name: role.name,
    description: role.description || '',
    permissions: [...(role.permissions || [])],
    siteId: role.siteId
  }
  showEditModal.value = true
}

function confirmDelete(role: Role) {
  roleToDelete.value = role
  showDeleteModal.value = true
}

async function createRole() {
  if (!form.value.name.trim()) {
    errorMessage.value = 'Nama role wajib diisi'
    showErrorModal.value = true
    return
  }
  
  saving.value = true
  try {
    await $fetch('/api/admin/roles', {
      method: 'POST',
      body: form.value
    })
    closeModal()
    await loadRoles()
  } catch (error: any) {
    errorMessage.value = error.data?.message || 'Gagal membuat role'
    showErrorModal.value = true
  } finally {
    saving.value = false
  }
}

async function updateRole() {
  if (!editingRole.value) return
  
  saving.value = true
  try {
    await $fetch(`/api/admin/roles/${editingRole.value.id}`, {
      method: 'PUT',
      body: form.value
    })
    closeModal()
    await loadRoles()
  } catch (error: any) {
    errorMessage.value = error.data?.message || 'Gagal mengupdate role'
    showErrorModal.value = true
  } finally {
    saving.value = false
  }
}

async function deleteRole() {
  if (!roleToDelete.value) return
  
  try {
    await $fetch(`/api/admin/roles/${roleToDelete.value.id}`, {
      method: 'DELETE'
    })
    showDeleteModal.value = false
    roleToDelete.value = null
    await loadRoles()
  } catch (error: any) {
    showDeleteModal.value = false
    errorMessage.value = error.data?.message || 'Gagal menghapus role'
    showErrorModal.value = true
  }
}

// === Users Management for Role ===
async function openUsersModal(role: Role) {
  usersRole.value = role
  showUsersModal.value = true
  loadingUsers.value = true
  
  try {
    // Fetch users with this role
    const roleUsersResponse = await $fetch<{ data: RoleUser[] }>(`/api/admin/roles/${role.id}/users`)
    roleUsers.value = roleUsersResponse.data || []
    
    // Fetch all users (for adding)
    if (allUsers.value.length === 0) {
      const usersResponse = await $fetch<{ data: RoleUser[] }>('/api/admin/users?limit=100')
      allUsers.value = usersResponse.data || []
    }
  } catch (error) {
    console.error('Failed to fetch users:', error)
  } finally {
    loadingUsers.value = false
  }
}

function closeUsersModal() {
  showUsersModal.value = false
  usersRole.value = null
  roleUsers.value = []
  userSearchQuery.value = ''
}

const filteredAvailableUsers = computed(() => {
  const assignedIds = new Set(roleUsers.value.map(u => u.id))
  let available = allUsers.value.filter(u => !assignedIds.has(u.id))
  
  if (userSearchQuery.value.trim()) {
    const query = userSearchQuery.value.toLowerCase()
    available = available.filter(u => 
      u.name.toLowerCase().includes(query) || 
      u.email.toLowerCase().includes(query)
    )
  }
  
  return available.slice(0, 20) // Limit to 20 results
})

function isUserInRole(userId: string): boolean {
  return roleUsers.value.some(u => u.id === userId)
}

async function addUserToRole(user: RoleUser) {
  if (!usersRole.value) return
  
  savingUser.value = true
  try {
    await $fetch(`/api/admin/roles/${usersRole.value.id}/users`, {
      method: 'POST',
      body: { userId: user.id }
    })
    roleUsers.value.push(user)
    await loadRoles() // Refresh role list to update user count
  } catch (error: any) {
    alert(error.data?.message || 'Gagal menambahkan user')
  } finally {
    savingUser.value = false
  }
}

async function removeUserFromRole(user: RoleUser) {
  if (!usersRole.value) return
  
  savingUser.value = true
  try {
    await $fetch(`/api/admin/roles/${usersRole.value.id}/users/${user.id}`, {
      method: 'DELETE'
    })
    roleUsers.value = roleUsers.value.filter(u => u.id !== user.id)
    await loadRoles() // Refresh role list to update user count
  } catch (error: any) {
    alert(error.data?.message || 'Gagal menghapus user')
  } finally {
    savingUser.value = false
  }
}

onMounted(() => {
  loadRoles()
  loadSites()
})
</script>
