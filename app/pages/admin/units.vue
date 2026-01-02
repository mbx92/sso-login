<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Master Unit</h1>
        <p class="text-sm text-gray-500 mt-1">Kelola data unit organisasi</p>
      </div>
      <UButton
        @click="openCreateModal"
        color="primary"
        icon="i-lucide-plus"
      >
        Tambah Unit
      </UButton>
    </div>

    <div class="flex flex-col sm:flex-row gap-4 mb-6">
      <UInput
        v-model="searchQuery"
        placeholder="Cari unit..."
        icon="i-lucide-search"
        class="flex-1 max-w-md"
      />
      <USelect
        v-model="filterDivision"
        :items="divisionFilterItems"
        placeholder="Semua Divisi"
        class="min-w-[180px]"
      />
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
                <div class="flex items-center gap-1">
                  <UButton
                    @click="openEditModal(unit)"
                    variant="ghost"
                    color="neutral"
                    icon="i-lucide-pencil"
                    size="sm"
                  />
                  <UButton
                    @click="confirmDelete(unit)"
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
                <USelect
                  v-model="form.divisionId"
                  :items="divisionOptions"
                  placeholder="Pilih Divisi"
                  :ui="{ base: 'w-full' }"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Kode Unit</label>
                <UInput
                  v-model="form.code"
                  placeholder="UNIT001"
                  required
                  :ui="{ root: 'w-full' }"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nama Unit</label>
                <UInput
                  v-model="form.name"
                  placeholder="Nama unit"
                  required
                  :ui="{ root: 'w-full' }"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <UTextarea
                  v-model="form.description"
                  :rows="3"
                  placeholder="Deskripsi unit (opsional)"
                  :ui="{ root: 'w-full' }"
                />
              </div>
              <UCheckbox
                v-model="form.isActive"
                label="Aktif"
              />
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
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Hapus Unit</h3>
          <p class="text-gray-600 mb-6">
            Apakah Anda yakin ingin menghapus unit <strong>{{ deletingUnit?.name }}</strong>?
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
              @click="deleteUnit"
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
const filterDivision = ref<string | null>(null)
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

// Filter items for USelect components
const divisionFilterItems = computed(() => {
  return [
    { label: 'Semua Divisi', value: null },
    ...divisions.value.map(d => ({ label: d.name, value: d.id }))
  ]
})

// Division options for modal select
const divisionOptions = computed(() => {
  return divisions.value.map(d => ({ label: d.name, value: d.id }))
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
