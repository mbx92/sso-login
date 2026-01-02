<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Master Divisi</h1>
        <p class="text-sm text-gray-500 mt-1">Kelola data divisi organisasi</p>
      </div>
      <button
        @click="openCreateModal"
        class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Tambah Divisi
      </button>
    </div>

    <!-- Search -->
    <div class="mb-6">
      <div class="relative max-w-md">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari divisi..."
          class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-sm"
        />
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Divisi</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deskripsi</th>
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
            <tr v-else-if="filteredDivisions.length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                Tidak ada data divisi
              </td>
            </tr>
            <tr v-for="division in filteredDivisions" :key="division.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="font-mono text-sm text-gray-900">{{ division.code }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm font-medium text-gray-900">{{ division.name }}</span>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-gray-500">{{ division.description || '-' }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                    division.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  ]"
                >
                  {{ division.isActive ? 'Aktif' : 'Nonaktif' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <button
                    @click="openEditModal(division)"
                    class="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    @click="confirmDelete(division)"
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
            {{ editingDivision ? 'Edit Divisi' : 'Tambah Divisi Baru' }}
          </h3>
          <form @submit.prevent="saveDivision">
            <div class="space-y-4">
              <!-- Site Selector for Superadmin -->
              <div v-if="isSuperAdmin">
                <label class="block text-sm font-medium text-gray-700 mb-1">Site</label>
                <select
                  v-model="form.siteId"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="" disabled>Pilih Site</option>
                  <option v-for="site in sites" :key="site.id" :value="site.id">
                    {{ site.name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Kode Divisi</label>
                <input
                  v-model="form.code"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="DIV001"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nama Divisi</label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Nama divisi"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea
                  v-model="form.description"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Deskripsi divisi (opsional)"
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
    <ConfirmModal
      :isOpen="showDeleteModal"
      title="Hapus Divisi"
      :message="`Apakah Anda yakin ingin menghapus divisi '${deletingDivision?.name}'? Tindakan ini tidak dapat dibatalkan.`"
      type="danger"
      confirmText="Hapus"
      cancelText="Batal"
      @confirm="deleteDivision"
      @cancel="showDeleteModal = false"
    />

    <!-- Error Modal -->
    <ErrorModal
      :isOpen="showErrorModal"
      :type="errorType"
      :title="errorTitle"
      :message="errorMessage"
      @close="showErrorModal = false"
    />
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
  description: string | null
  isActive: boolean
}

const divisions = ref<Division[]>([])
const loading = ref(true)
const searchQuery = ref('')
const showModal = ref(false)
const showDeleteModal = ref(false)
const saving = ref(false)
const deleting = ref(false)
const editingDivision = ref<Division | null>(null)
const deletingDivision = ref<Division | null>(null)

const isSuperAdmin = computed(() => currentUser.value?.roleId === 'superadmin')
const userSiteId = computed(() => currentUser.value?.siteId || '')

// Sites for superadmin
const sites = ref<{ id: string; name: string }[]>([])

const form = ref({
  siteId: '',
  code: '',
  name: '',
  description: '',
  isActive: true
})

// Watch for user cookie changes to set siteId
watch(userSiteId, (newSiteId) => {
  if (newSiteId && !form.value.siteId) {
    form.value.siteId = newSiteId
  }
}, { immediate: true })

// Error modal state
const showErrorModal = ref(false)
const errorType = ref<'error' | 'warning' | 'success' | 'info'>('error')
const errorTitle = ref('')
const errorMessage = ref('')

function showError(title: string, message: string, type: 'error' | 'warning' | 'success' | 'info' = 'error') {
  errorTitle.value = title
  errorMessage.value = message
  errorType.value = type
  showErrorModal.value = true
}

const filteredDivisions = computed(() => {
  if (!searchQuery.value) return divisions.value
  const query = searchQuery.value.toLowerCase()
  return divisions.value.filter(d =>
    d.code.toLowerCase().includes(query) ||
    d.name.toLowerCase().includes(query)
  )
})

async function fetchSites() {
  if (!isSuperAdmin.value) return
  try {
    const response = await $fetch<{ sites: { id: string; name: string }[] }>('/api/admin/sites')
    sites.value = response.sites
  } catch (error) {
    console.error('Failed to fetch sites:', error)
  }
}

async function fetchDivisions() {
  loading.value = true
  try {
    const response = await $fetch<{ divisions: Division[] }>('/api/admin/divisions')
    divisions.value = response.divisions
  } catch (error) {
    console.error('Failed to fetch divisions:', error)
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  editingDivision.value = null
  // Get siteId from user session - critical for site admins
  const siteIdFromUser = currentUser.value?.siteId || ''
  form.value = { 
    siteId: siteIdFromUser, 
    code: '', 
    name: '', 
    description: '', 
    isActive: true 
  }
  showModal.value = true
}

function openEditModal(division: Division) {
  editingDivision.value = division
  form.value = {
    siteId: (division as any).siteId || userSiteId.value || '',
    code: division.code,
    name: division.name,
    description: division.description || '',
    isActive: division.isActive
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingDivision.value = null
}

async function saveDivision() {
  // Validate siteId - get directly from form or current user
  const siteId = form.value.siteId || currentUser.value?.siteId || ''
  if (!siteId) {
    showError('Validasi Gagal', 'Silakan pilih site terlebih dahulu', 'warning')
    return
  }

  saving.value = true
  try {
    const payload = {
      ...form.value,
      siteId
    }
    
    if (editingDivision.value) {
      await $fetch(`/api/admin/divisions/${editingDivision.value.id}`, {
        method: 'PUT',
        body: payload
      })
      showError('Berhasil', 'Divisi berhasil diperbarui', 'success')
    } else {
      await $fetch('/api/admin/divisions', {
        method: 'POST',
        body: payload
      })
      showError('Berhasil', 'Divisi berhasil dibuat', 'success')
    }
    closeModal()
    await fetchDivisions()
  } catch (error: any) {
    showError('Gagal Menyimpan', error.data?.message || 'Terjadi kesalahan saat menyimpan divisi', 'error')
  } finally {
    saving.value = false
  }
}

function confirmDelete(division: Division) {
  deletingDivision.value = division
  showDeleteModal.value = true
}

async function deleteDivision() {
  if (!deletingDivision.value) return
  deleting.value = true
  try {
    await $fetch(`/api/admin/divisions/${deletingDivision.value.id}`, {
      method: 'DELETE'
    })
    showDeleteModal.value = false
    showError('Berhasil', 'Divisi berhasil dihapus', 'success')
    await fetchDivisions()
  } catch (error: any) {
    showError('Gagal Menghapus', error.data?.message || 'Terjadi kesalahan saat menghapus divisi', 'error')
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchSites()
  fetchDivisions()
})
</script>
