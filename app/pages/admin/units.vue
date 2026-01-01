<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Master Unit</h1>
        <p class="text-sm text-gray-500 mt-1">Kelola data unit organisasi</p>
      </div>
      <button
        @click="openCreateModal"
        class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Tambah Unit
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-4 mb-6">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Cari unit..."
        class="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
      />
      <select
        v-model="filterDivision"
        class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
      >
        <option value="">Semua Divisi</option>
        <option v-for="division in divisions" :key="division.id" :value="division.id">
          {{ division.name }}
        </option>
      </select>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Unit</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Divisi</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="loading">
              <td colspan="5" class="px-6 py-12 text-center">
                <div class="flex items-center justify-center gap-2 text-gray-500">
                  <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memuat data...
                </div>
              </td>
            </tr>
            <tr v-else-if="filteredUnits.length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                Tidak ada data unit
              </td>
            </tr>
            <tr v-for="unit in filteredUnits" :key="unit.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="font-mono text-sm text-gray-900">{{ unit.code }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm font-medium text-gray-900">{{ unit.name }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-600">{{ unit.divisionName || '-' }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                    unit.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  ]"
                >
                  {{ unit.isActive ? 'Aktif' : 'Nonaktif' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <button
                    @click="openEditModal(unit)"
                    class="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    @click="confirmDelete(unit)"
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
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen px-4">
        <div class="fixed inset-0 bg-black/50" @click="closeModal"></div>
        <div class="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            {{ editingUnit ? 'Edit Unit' : 'Tambah Unit Baru' }}
          </h3>
          <form @submit.prevent="saveUnit">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Divisi</label>
                <select
                  v-model="form.divisionId"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Pilih Divisi</option>
                  <option v-for="division in divisions" :key="division.id" :value="division.id">
                    {{ division.name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Kode Unit</label>
                <input
                  v-model="form.code"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="UNIT001"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nama Unit</label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Nama unit"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea
                  v-model="form.description"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Deskripsi unit (opsional)"
                ></textarea>
              </div>
              <div class="flex items-center gap-2">
                <input
                  v-model="form.isActive"
                  type="checkbox"
                  id="isActive"
                  class="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <label for="isActive" class="text-sm text-gray-700">Aktif</label>
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
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Hapus Unit</h3>
          <p class="text-gray-600 mb-6">
            Apakah Anda yakin ingin menghapus unit <strong>{{ deletingUnit?.name }}</strong>?
          </p>
          <div class="flex justify-end gap-3">
            <button
              @click="showDeleteModal = false"
              class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Batal
            </button>
            <button
              @click="deleteUnit"
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
  layout: 'admin',
  middleware: ['auth']
})

// Get user from cookie for siteId
const userCookie = useCookie('sso_user')
const currentUser = computed(() => {
  if (!userCookie.value) return null
  try {
    if (typeof userCookie.value === 'string') {
      return JSON.parse(userCookie.value)
    }
    return userCookie.value
  } catch {
    return null
  }
})

interface Division {
  id: string
  code: string
  name: string
  siteId?: string
}

interface Unit {
  id: string
  code: string
  name: string
  description: string | null
  divisionId: string
  divisionName: string | null
  isActive: boolean
}

const units = ref<Unit[]>([])
const divisions = ref<Division[]>([])
const loading = ref(true)
const searchQuery = ref('')
const filterDivision = ref('')
const showModal = ref(false)
const showDeleteModal = ref(false)
const saving = ref(false)
const deleting = ref(false)
const editingUnit = ref<Unit | null>(null)
const deletingUnit = ref<Unit | null>(null)

const form = ref({
  code: '',
  name: '',
  description: '',
  divisionId: '',
  siteId: '',
  isActive: true
})

const filteredUnits = computed(() => {
  let result = units.value
  
  if (filterDivision.value) {
    result = result.filter(u => u.divisionId === filterDivision.value)
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(u =>
      u.code.toLowerCase().includes(query) ||
      u.name.toLowerCase().includes(query)
    )
  }
  
  return result
})

async function fetchData() {
  loading.value = true
  try {
    const [unitsResponse, divisionsResponse] = await Promise.all([
      $fetch<{ units: Unit[] }>('/api/admin/units'),
      $fetch<{ divisions: Division[] }>('/api/admin/divisions')
    ])
    units.value = unitsResponse.units
    divisions.value = divisionsResponse.divisions
  } catch (error) {
    console.error('Failed to fetch data:', error)
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  editingUnit.value = null
  const siteIdFromUser = currentUser.value?.siteId || ''
  form.value = { code: '', name: '', description: '', divisionId: '', siteId: siteIdFromUser, isActive: true }
  showModal.value = true
}

function openEditModal(unit: Unit) {
  editingUnit.value = unit
  form.value = {
    code: unit.code,
    name: unit.name,
    description: unit.description || '',
    divisionId: unit.divisionId,
    siteId: (unit as any).siteId || currentUser.value?.siteId || '',
    isActive: unit.isActive
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingUnit.value = null
}

async function saveUnit() {
  // Set siteId from selected division if not already set
  if (form.value.divisionId && !form.value.siteId) {
    const selectedDivision = divisions.value.find(d => d.id === form.value.divisionId)
    if (selectedDivision?.siteId) {
      form.value.siteId = selectedDivision.siteId
    }
  }
  
  // Final fallback to user's siteId
  if (!form.value.siteId && currentUser.value?.siteId) {
    form.value.siteId = currentUser.value.siteId
  }

  saving.value = true
  try {
    if (editingUnit.value) {
      await $fetch(`/api/admin/units/${editingUnit.value.id}`, {
        method: 'PUT',
        body: form.value
      })
    } else {
      await $fetch('/api/admin/units', {
        method: 'POST',
        body: form.value
      })
    }
    closeModal()
    await fetchData()
  } catch (error: any) {
    alert(error.data?.message || 'Gagal menyimpan unit')
  } finally {
    saving.value = false
  }
}

function confirmDelete(unit: Unit) {
  deletingUnit.value = unit
  showDeleteModal.value = true
}

async function deleteUnit() {
  if (!deletingUnit.value) return
  deleting.value = true
  try {
    await $fetch(`/api/admin/units/${deletingUnit.value.id}`, {
      method: 'DELETE'
    })
    showDeleteModal.value = false
    await fetchData()
  } catch (error: any) {
    alert(error.data?.message || 'Gagal menghapus unit')
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>
