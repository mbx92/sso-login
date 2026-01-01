<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Manajemen User</h1>
        <p class="text-sm text-gray-500 mt-1">Kelola data pengguna sistem</p>
      </div>
      <button
        @click="openCreateModal"
        class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Tambah User
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-4 mb-6">
      <div class="relative flex-1 max-w-md">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari user..."
          class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
          @keyup.enter="fetchUsers"
        />
      </div>
      <select
        v-model="filterUnit"
        class="px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.5rem_1.5rem] bg-[right_0.5rem_center] bg-no-repeat"
      >
        <option value="">Semua Unit</option>
        <option v-for="unit in units" :key="unit.id" :value="unit.id">
          {{ unit.name }}
        </option>
      </select>
      <select
        v-model="filterStatus"
        class="px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.5rem_1.5rem] bg-[right_0.5rem_center] bg-no-repeat"
      >
        <option value="">Semua Status</option>
        <option value="active">Aktif</option>
        <option value="inactive">Nonaktif</option>
        <option value="pending">Pending</option>
      </select>
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
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dibuat</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="loading">
              <td colspan="6" class="px-6 py-12 text-center">
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
              <td colspan="6" class="px-6 py-12 text-center text-gray-500">
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
                <div class="flex items-center gap-2">
                  <button
                    @click="openEditModal(user)"
                    class="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    @click="confirmDelete(user)"
                    class="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
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
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Nama lengkap"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  v-model="form.email"
                  type="email"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Password
                  <span v-if="editingUser" class="text-gray-400 font-normal">(kosongkan jika tidak diubah)</span>
                </label>
                <input
                  v-model="form.password"
                  type="password"
                  :required="!editingUser"
                  minlength="8"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Minimal 8 karakter"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <input
                  v-model="form.employeeId"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="EMP001 (opsional)"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select
                  v-model="form.unitId"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Tidak ada unit</option>
                  <option v-for="unit in units" :key="unit.id" :value="unit.id">
                    {{ unit.divisionName ? `${unit.divisionName} - ${unit.name}` : unit.name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  v-model="form.status"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
            <div class="flex justify-end gap-3 mt-6">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {{ saving ? 'Menyimpan...' : 'Simpan' }}
              </button>
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
            <button
              @click="showDeleteModal = false"
              class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Batal
            </button>
            <button
              @click="deleteUser"
              :disabled="deleting"
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {{ deleting ? 'Menghapus...' : 'Hapus' }}
            </button>
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
}

const users = ref<User[]>([])
const units = ref<Unit[]>([])
const loading = ref(true)
const searchQuery = ref('')
const filterUnit = ref('')
const filterStatus = ref('')
const showModal = ref(false)
const showDeleteModal = ref(false)
const saving = ref(false)
const deleting = ref(false)
const editingUser = ref<User | null>(null)
const deletingUser = ref<User | null>(null)
const currentPage = ref(1)

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

onMounted(() => {
  Promise.all([fetchUsers(), fetchUnits()])
})
</script>
