<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Master Divisi</h1>
        <p class="text-sm text-gray-500 mt-1">Kelola data divisi organisasi</p>
      </div>
      <UButton
        @click="openCreateModal"
        color="primary"
        icon="i-lucide-plus"
      >
        Tambah Divisi
      </UButton>
    </div>

    <!-- Search -->
    <div class="mb-6">
      <UInput
        v-model="searchQuery"
        placeholder="Cari divisi..."
        icon="i-lucide-search"
        class="max-w-md"
      />
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
                <div class="flex items-center gap-1">
                  <UButton
                    @click="openEditModal(division)"
                    variant="ghost"
                    color="neutral"
                    icon="i-lucide-pencil"
                    size="sm"
                  />
                  <UButton
                    @click="confirmDelete(division)"
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
            {{ editingDivision ? 'Edit Divisi' : 'Tambah Divisi Baru' }}
          </h3>
          <form @submit.prevent="saveDivision">
            <div class="space-y-4">
              <!-- Site Selector for Superadmin -->
              <div v-if="isSuperAdmin">
                <label class="block text-sm font-medium text-gray-700 mb-1">Site</label>
                <USelect
                  v-model="form.siteId"
                  :items="siteOptions"
                  placeholder="Pilih Site"
                  :ui="{ base: 'w-full' }"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Kode Divisi</label>
                <UInput
                  v-model="form.code"
                  placeholder="DIV001"
                  required
                  :ui="{ root: 'w-full' }"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nama Divisi</label>
                <UInput
                  v-model="form.name"
                  placeholder="Nama divisi"
                  required
                  :ui="{ root: 'w-full' }"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <UTextarea
                  v-model="form.description"
                  :rows="3"
                  placeholder="Deskripsi divisi (opsional)"
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

// Site options for USelect
const siteOptions = computed(() => {
  return sites.value.map(s => ({ label: s.name, value: s.id }))
})

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
