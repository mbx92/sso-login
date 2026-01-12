<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Manajemen User</h1>
        <p class="text-sm text-gray-500 mt-1">Kelola data pengguna sistem</p>
      </div>
      <UButton
        @click="openCreateModal"
        color="primary"
        icon="i-lucide-plus"
      >
        Tambah User
      </UButton>
    </div>

    <div class="flex flex-col sm:flex-row gap-4 mb-6">
      <UInput
        v-model="searchQuery"
        placeholder="Cari user..."
        icon="i-lucide-search"
        class="flex-1 max-w-md"
        @keyup.enter="fetchUsers"
      />
      <USelect
        v-model="filterUnit"
        :items="unitFilterItems"
        placeholder="Semua Unit"
        class="min-w-[180px]"
      />
      <USelect
        v-model="filterStatus"
        :items="statusFilterItems"
        placeholder="Semua Status"
        class="min-w-[180px]"
      />
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dibuat</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="loading">
              <td colspan="7" class="px-6 py-12 text-center">
                <div class="flex items-center justify-center gap-2 text-gray-500">
                  <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memuat data...
                </div>
              </td>
            </tr>
            <tr v-else-if="filteredUsers.length === 0">
              <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                Tidak ada data user
              </td>
            </tr>
            <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <span class="text-emerald-700 font-semibold">{{ user.name?.charAt(0).toUpperCase() || '?' }}</span>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{{ user.name }}</p>
                    <p class="text-sm text-gray-500">{{ user.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="font-mono text-sm text-gray-600">{{ user.employeeId || '-' }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-600">{{ user.unitName || '-' }}</span>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="role in (user.roles || []).slice(0, 2)"
                    :key="role"
                    class="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800"
                  >
                    {{ role }}
                  </span>
                  <span
                    v-if="(user.roles || []).length > 2"
                    class="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600"
                  >
                    +{{ (user.roles || []).length - 2 }}
                  </span>
                  <span
                    v-if="(user.roles || []).length === 0"
                    class="text-xs text-gray-400"
                  >
                    No roles
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                    user.status === 'active' ? 'bg-green-100 text-green-800' :
                    user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  ]"
                >
                  {{ user.status === 'active' ? 'Aktif' : user.status === 'pending' ? 'Pending' : 'Nonaktif' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(user.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-1">
                  <UButton
                    @click="openRolesModal(user)"
                    variant="ghost"
                    color="primary"
                    icon="i-lucide-shield"
                    size="sm"
                    title="Manage Roles"
                  />
                  <UButton
                    @click="openEditModal(user)"
                    variant="ghost"
                    color="neutral"
                    icon="i-lucide-pencil"
                    size="sm"
                  />
                  <UButton
                    @click="confirmDelete(user)"
                    variant="ghost"
                    color="error"
                    icon="i-lucide-trash-2"
                    size="sm"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
        <p class="text-sm text-gray-600">
          Halaman {{ pagination.page }} dari {{ pagination.totalPages }} ({{ pagination.total }} user)
        </p>
        <div class="flex gap-2">
          <button
            @click="changePage(pagination.page - 1)"
            :disabled="pagination.page <= 1"
            class="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Sebelumnya
          </button>
          <button
            @click="changePage(pagination.page + 1)"
            :disabled="pagination.page >= pagination.totalPages"
            class="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Selanjutnya
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen px-4">
        <div class="fixed inset-0 bg-black/50" @click="closeModal"></div>
        <div class="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            {{ editingUser ? 'Edit User' : 'Tambah User Baru' }}
          </h3>
          <form @submit.prevent="saveUser">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <UInput
                  v-model="form.name"
                  placeholder="Nama lengkap"
                  required
                  class="w-full"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <UInput
                  v-model="form.email"
                  type="email"
                  placeholder="user@example.com"
                  required
                  class="w-full"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Password
                  <span v-if="editingUser" class="text-gray-400 font-normal">(kosongkan jika tidak diubah)</span>
                </label>
                <UInput
                  v-model="form.password"
                  type="password"
                  :required="!editingUser"
                  placeholder="Minimal 8 karakter"
                  class="w-full"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <UInput
                  v-model="form.employeeId"
                  placeholder="EMP001 (opsional)"
                  class="w-full"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <USelect
                  v-model="form.unitId"
                  :items="unitOptions"
                  placeholder="Pilih unit"
                  class="w-full"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <USelect
                  v-model="form.status"
                  :items="statusOptions"
                  class="w-full"
                />
              </div>
            </div>
            <div class="flex justify-end gap-3 mt-6">
              <UButton
                type="button"
                @click="closeModal"
                variant="outline"
                color="neutral"
              >
                Batal
              </UButton>
              <UButton
                type="submit"
                :disabled="saving"
                :loading="saving"
                color="primary"
              >
                Simpan
              </UButton>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen px-4">
        <div class="fixed inset-0 bg-black/50" @click="showDeleteModal = false"></div>
        <div class="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Hapus User</h3>
          <p class="text-gray-600 mb-6">
            Apakah Anda yakin ingin menghapus user <strong>{{ deletingUser?.name }}</strong>?
          </p>
          <div class="flex justify-end gap-3">
            <UButton
              @click="showDeleteModal = false"
              variant="outline"
              color="neutral"
            >
              Batal
            </UButton>
            <UButton
              @click="deleteUser"
              :disabled="deleting"
              :loading="deleting"
              color="error"
            >
              Hapus
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Manage Roles Modal -->
    <div v-if="showRolesModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen px-4">
        <div class="fixed inset-0 bg-black/50" @click="closeRolesModal"></div>
        <div class="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Kelola Roles</h3>
          <p class="text-sm text-gray-500 mb-4">
            Assign roles untuk <strong>{{ rolesUser?.name }}</strong>
          </p>
          
          <div v-if="loadingRoles" class="py-8 text-center text-gray-500">
            <svg class="animate-spin h-6 w-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Memuat roles...
          </div>
          
          <div v-else class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="role in allRoles"
              :key="role.id"
              class="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
              @click="toggleUserRole(role)"
            >
              <div class="flex items-center gap-3">
                <div :class="[
                  'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                  isRoleAssigned(role.id) 
                    ? 'bg-emerald-500 border-emerald-500' 
                    : 'border-gray-300'
                ]">
                  <svg v-if="isRoleAssigned(role.id)" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p class="font-medium text-gray-900">{{ role.name }}</p>
                  <p v-if="role.description" class="text-xs text-gray-500">{{ role.description }}</p>
                </div>
              </div>
              <span v-if="role.isSystem" class="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Sistem</span>
            </div>
            
            <div v-if="allRoles.length === 0" class="py-4 text-center text-gray-500">
              Tidak ada role tersedia
            </div>
          </div>
          
          <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <UButton
              @click="closeRolesModal"
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
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

interface Unit {
  id: string
  code: string
  name: string
  divisionName: string | null
}

interface User {
  id: string
  email: string
  name: string
  employeeId: string | null
  unitId: string | null
  unitName: string | null
  status: string
  createdAt: string
  roles?: string[]
}

interface Role {
  id: string
  name: string
  description: string | null
  isSystem: boolean
}

const users = ref<User[]>([])
const units = ref<Unit[]>([])
const loading = ref(true)
const searchQuery = ref('')
const filterUnit = ref<string | null>(null)
const filterStatus = ref<string | null>(null)
const showModal = ref(false)
const showDeleteModal = ref(false)
const saving = ref(false)
const deleting = ref(false)
const editingUser = ref<User | null>(null)
const deletingUser = ref<User | null>(null)
const currentPage = ref(1)

// Roles management
const showRolesModal = ref(false)
const rolesUser = ref<User | null>(null)
const allRoles = ref<Role[]>([])
const userAssignedRoles = ref<Role[]>([])
const loadingRoles = ref(false)
const savingRole = ref(false)

const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
})

const form = ref({
  email: '',
  name: '',
  password: '',
  employeeId: '',
  unitId: '',
  status: 'active'
})

const filteredUsers = computed(() => {
  let result = users.value
  
  if (filterUnit.value) {
    result = result.filter(u => u.unitId === filterUnit.value)
  }
  
  if (filterStatus.value) {
    result = result.filter(u => u.status === filterStatus.value)
  }
  
  return result
})

// Filter items for USelect components
const unitFilterItems = computed(() => {
  return [
    { label: 'Semua Unit', value: null },
    ...units.value.map(u => ({ label: u.name, value: u.id }))
  ]
})

const statusFilterItems = [
  { label: 'Semua Status', value: null },
  { label: 'Aktif', value: 'active' },
  { label: 'Nonaktif', value: 'inactive' },
  { label: 'Pending', value: 'pending' }
]

// Options for form selects
const unitOptions = computed(() => {
  return [
    { label: 'Tidak ada unit', value: null },
    ...units.value.map(u => ({ 
      label: u.divisionName ? `${u.divisionName} - ${u.name}` : u.name, 
      value: u.id 
    }))
  ]
})

const statusOptions = [
  { label: 'Aktif', value: 'active' },
  { label: 'Nonaktif', value: 'inactive' },
  { label: 'Pending', value: 'pending' }
]

async function fetchUsers() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: '20'
    })
    if (searchQuery.value) {
      params.append('search', searchQuery.value)
    }
    
    const response = await $fetch<{
      data: User[]
      pagination: typeof pagination.value
    }>(`/api/admin/users?${params}`)
    
    users.value = response.data
    pagination.value = response.pagination
  } catch (error) {
    console.error('Failed to fetch users:', error)
  } finally {
    loading.value = false
  }
}

async function fetchUnits() {
  try {
    const response = await $fetch<{ units: Unit[] }>('/api/admin/units')
    units.value = response.units
  } catch (error) {
    console.error('Failed to fetch units:', error)
  }
}

function changePage(page: number) {
  currentPage.value = page
  fetchUsers()
}

function openCreateModal() {
  editingUser.value = null
  form.value = {
    email: '',
    name: '',
    password: '',
    employeeId: '',
    unitId: '',
    status: 'active'
  }
  showModal.value = true
}

function openEditModal(user: User) {
  editingUser.value = user
  form.value = {
    email: user.email,
    name: user.name,
    password: '',
    employeeId: user.employeeId || '',
    unitId: user.unitId || '',
    status: user.status
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingUser.value = null
}

async function saveUser() {
  saving.value = true
  try {
    const payload: Record<string, any> = {
      email: form.value.email,
      name: form.value.name,
      employeeId: form.value.employeeId || null,
      unitId: form.value.unitId || null,
      status: form.value.status
    }
    
    // Only include password if provided
    if (form.value.password) {
      payload.password = form.value.password
    }

    if (editingUser.value) {
      await $fetch(`/api/admin/users/${editingUser.value.id}`, {
        method: 'PUT',
        body: payload
      })
    } else {
      await $fetch('/api/admin/users', {
        method: 'POST',
        body: payload
      })
    }
    closeModal()
    await fetchUsers()
  } catch (error: any) {
    alert(error.data?.message || 'Gagal menyimpan user')
  } finally {
    saving.value = false
  }
}

function confirmDelete(user: User) {
  deletingUser.value = user
  showDeleteModal.value = true
}

async function deleteUser() {
  if (!deletingUser.value) return
  deleting.value = true
  try {
    await $fetch(`/api/admin/users/${deletingUser.value.id}`, {
      method: 'DELETE'
    })
    showDeleteModal.value = false
    await fetchUsers()
  } catch (error: any) {
    alert(error.data?.message || 'Gagal menghapus user')
  } finally {
    deleting.value = false
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// === Roles Management ===
async function openRolesModal(user: User) {
  rolesUser.value = user
  showRolesModal.value = true
  loadingRoles.value = true
  
  try {
    // Fetch all available roles
    if (allRoles.value.length === 0) {
      const rolesResponse = await $fetch<{ data: Role[] }>('/api/admin/roles')
      allRoles.value = rolesResponse.data || []
    }
    
    // Fetch user's assigned roles
    const userRolesResponse = await $fetch<{ data: Role[] }>(`/api/admin/users/${user.id}/roles`)
    userAssignedRoles.value = userRolesResponse.data || []
  } catch (error) {
    console.error('Failed to fetch roles:', error)
  } finally {
    loadingRoles.value = false
  }
}

function closeRolesModal() {
  showRolesModal.value = false
  rolesUser.value = null
  userAssignedRoles.value = []
}

function isRoleAssigned(roleId: string): boolean {
  return userAssignedRoles.value.some(r => r.id === roleId)
}

async function toggleUserRole(role: Role) {
  if (!rolesUser.value) return
  
  savingRole.value = true
  try {
    if (isRoleAssigned(role.id)) {
      // Remove role
      await $fetch(`/api/admin/users/${rolesUser.value.id}/roles/${role.id}`, {
        method: 'DELETE'
      })
      userAssignedRoles.value = userAssignedRoles.value.filter(r => r.id !== role.id)
    } else {
      // Assign role
      await $fetch(`/api/admin/users/${rolesUser.value.id}/roles`, {
        method: 'POST',
        body: { roleId: role.id }
      })
      userAssignedRoles.value.push(role)
    }
    // Refresh users list to update roles display
    await fetchUsers()
  } catch (error: any) {
    alert(error.data?.message || 'Gagal mengubah role')
  } finally {
    savingRole.value = false
  }
}

onMounted(() => {
  Promise.all([fetchUsers(), fetchUnits()])
})
</script>
