<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-900">Site Management</h1>
      <button
        @click="openCreateModal"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        + Tambah Site
      </button>
    </div>

    <!-- Sites Cards with Tree View -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div 
        v-for="site in sites" 
        :key="site.id" 
        class="bg-white shadow-md rounded-lg overflow-hidden"
      >
        <!-- Site Header -->
        <div class="px-6 py-4 bg-blue-600 text-white">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 class="font-bold text-lg">{{ site.name }}</h3>
                <p class="text-blue-100 text-sm">{{ site.code }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span 
                class="px-2 py-1 text-xs font-medium rounded-full"
                :class="site.isActive ? 'bg-green-400/20 text-green-100' : 'bg-red-400/20 text-red-100'"
              >
                {{ site.isActive ? 'Aktif' : 'Nonaktif' }}
              </span>
              <button
                @click="toggleTreeExpand(site.id)"
                class="p-1 hover:bg-white/10 rounded transition-colors"
                :title="expandedSites.has(site.id) ? 'Tutup' : 'Lihat Struktur'"
              >
                <svg 
                  class="w-5 h-5 transition-transform" 
                  :class="{ 'rotate-180': expandedSites.has(site.id) }"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
          <p v-if="site.address" class="text-blue-100 text-sm mt-2">📍 {{ site.address }}</p>
        </div>

        <!-- Site Tree (Expanded) -->
        <div v-if="expandedSites.has(site.id)" class="border-t border-gray-100">
          <!-- Loading State -->
          <div v-if="loadingTrees.has(site.id)" class="p-6 text-center text-gray-500">
            <svg class="animate-spin h-6 w-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Memuat struktur...
          </div>

          <!-- Tree Content -->
          <div v-else-if="siteTrees[site.id]" class="p-4">
            <!-- Stats -->
            <div class="flex gap-4 mb-4 text-sm">
              <div class="flex items-center gap-1 text-gray-600">
                <span class="w-2 h-2 bg-emerald-500 rounded-full"></span>
                {{ siteTrees[site.id].stats.totalDivisions }} Divisi
              </div>
              <div class="flex items-center gap-1 text-gray-600">
                <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
                {{ siteTrees[site.id].stats.totalUnits }} Unit
              </div>
            </div>

            <!-- Tree View -->
            <div v-if="siteTrees[site.id].tree.length > 0" class="space-y-2">
              <div 
                v-for="division in siteTrees[site.id].tree" 
                :key="division.id"
                class="border border-gray-200 rounded-lg overflow-hidden"
              >
                <!-- Division Header -->
                <div 
                  class="flex items-center gap-3 px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  @click="toggleDivisionExpand(site.id, division.id)"
                >
                  <svg 
                    class="w-4 h-4 text-gray-400 transition-transform"
                    :class="{ 'rotate-90': expandedDivisions.has(`${site.id}-${division.id}`) }"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                  <div class="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="font-medium text-gray-900">{{ division.name }}</p>
                    <p class="text-xs text-gray-500">{{ division.code }} • {{ division.children.length }} unit</p>
                  </div>
                  <span 
                    class="px-2 py-0.5 text-xs rounded-full"
                    :class="division.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                  >
                    {{ division.isActive ? 'Aktif' : 'Nonaktif' }}
                  </span>
                </div>

                <!-- Units (Children) -->
                <div 
                  v-if="expandedDivisions.has(`${site.id}-${division.id}`) && division.children.length > 0"
                  class="border-t border-gray-100 bg-white"
                >
                  <div 
                    v-for="(unit, index) in division.children" 
                    :key="unit.id"
                    class="flex items-center gap-3 px-4 py-2 pl-12 hover:bg-gray-50"
                    :class="{ 'border-t border-gray-100': index > 0 }"
                  >
                    <div class="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                      <svg class="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div class="flex-1">
                      <p class="text-sm text-gray-900">{{ unit.name }}</p>
                      <p class="text-xs text-gray-500">{{ unit.code }}</p>
                    </div>
                    <span 
                      class="px-2 py-0.5 text-xs rounded-full"
                      :class="unit.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                    >
                      {{ unit.isActive ? 'Aktif' : 'Nonaktif' }}
                    </span>
                  </div>
                </div>

                <!-- No Units Message -->
                <div 
                  v-if="expandedDivisions.has(`${site.id}-${division.id}`) && division.children.length === 0"
                  class="border-t border-gray-100 px-4 py-3 pl-12 text-sm text-gray-400 italic"
                >
                  Belum ada unit dalam divisi ini
                </div>
              </div>
            </div>

            <!-- Empty State for Tree -->
            <div v-else class="text-center py-8 text-gray-400">
              <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p>Belum ada divisi dalam site ini</p>
            </div>
          </div>
        </div>

        <!-- Site Actions -->
        <div class="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
          <button
            @click="openEditModal(site)"
            class="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            Edit
          </button>
          <button
            @click="confirmDelete(site)"
            class="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="sites.length === 0" class="bg-white shadow-md rounded-lg p-12 text-center">
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Belum Ada Site</h3>
      <p class="text-gray-500 mb-4">Mulai dengan menambahkan site pertama Anda</p>
      <button
        @click="openCreateModal"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        + Tambah Site
      </button>
    </div>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto">
        <div class="fixed inset-0 bg-black/50" @click="closeModal"></div>
        
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div class="px-6 pt-6 pb-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">
                {{ isEditing ? 'Edit Site' : 'Tambah Site' }}
              </h3>
            </div>

            <form @submit.prevent="submitForm" class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Kode Site</label>
                <input
                  v-model="formData.code"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan kode site"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nama Site</label>
                <input
                  v-model="formData.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan nama site"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea
                  v-model="formData.description"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan deskripsi (opsional)"
                ></textarea>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                <textarea
                  v-model="formData.address"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan alamat (opsional)"
                ></textarea>
              </div>

              <div class="flex items-center">
                <input
                  v-model="formData.isActive"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label class="ml-2 text-sm text-gray-700">Aktif</label>
              </div>

              <div class="pt-4 flex justify-end gap-3 border-t border-gray-200">
                <button
                  type="button"
                  @click="closeModal"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  :disabled="loading"
                  class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {{ loading ? 'Menyimpan...' : (isEditing ? 'Update' : 'Simpan') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Confirm Delete Modal -->
    <ConfirmModal
      :is-open="showDeleteConfirm"
      :title="'Hapus Site'"
      :message="`Apakah Anda yakin ingin menghapus site ${siteToDelete?.name}? Data divisi dan unit yang terkait juga akan terpengaruh.`"
      :type="'danger'"
      :confirm-text="'Hapus'"
      :cancel-text="'Batal'"
      @confirm="deleteSite"
      @cancel="showDeleteConfirm = false"
    />

    <!-- Error Modal -->
    <ConfirmModal
      :is-open="showErrorModal"
      :title="'Error'"
      :message="errorMessage"
      :type="'danger'"
      :confirm-text="'OK'"
      :cancel-text="''"
      @confirm="showErrorModal = false"
      @cancel="showErrorModal = false"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth']
})

// Check if user is superadmin, redirect if not
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

const isSuperAdmin = computed(() => currentUser.value?.roleId === 'superadmin')

interface Site {
  id: string
  code: string
  name: string
  description: string | null
  address: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface TreeUnit {
  id: string
  code: string
  name: string
  description: string | null
  isActive: boolean
  type: 'unit'
}

interface TreeDivision {
  id: string
  code: string
  name: string
  description: string | null
  isActive: boolean
  type: 'division'
  children: TreeUnit[]
}

interface SiteTree {
  site: Site
  tree: TreeDivision[]
  stats: {
    totalDivisions: number
    totalUnits: number
  }
}

const sites = ref<Site[]>([])
const showModal = ref(false)
const showDeleteConfirm = ref(false)
const loading = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const siteToDelete = ref<Site | null>(null)
const errorMessage = ref('')
const showErrorModal = ref(false)

// Tree view state
const expandedSites = ref<Set<string>>(new Set())
const expandedDivisions = ref<Set<string>>(new Set())
const loadingTrees = ref<Set<string>>(new Set())
const siteTrees = ref<Record<string, SiteTree>>({})

const formData = ref({
  code: '',
  name: '',
  description: '',
  address: '',
  isActive: true
})

onMounted(() => {
  if (!isSuperAdmin.value) {
    navigateTo('/admin')
    return
  }
  fetchSites()
})

async function toggleTreeExpand(siteId: string) {
  if (expandedSites.value.has(siteId)) {
    expandedSites.value.delete(siteId)
    expandedSites.value = new Set(expandedSites.value)
  } else {
    expandedSites.value.add(siteId)
    expandedSites.value = new Set(expandedSites.value)
    
    // Load tree if not already loaded
    if (!siteTrees.value[siteId]) {
      await loadSiteTree(siteId)
    }
  }
}

function toggleDivisionExpand(siteId: string, divisionId: string) {
  const key = `${siteId}-${divisionId}`
  if (expandedDivisions.value.has(key)) {
    expandedDivisions.value.delete(key)
  } else {
    expandedDivisions.value.add(key)
  }
  expandedDivisions.value = new Set(expandedDivisions.value)
}

async function loadSiteTree(siteId: string) {
  loadingTrees.value.add(siteId)
  loadingTrees.value = new Set(loadingTrees.value)
  
  try {
    const response = await $fetch<SiteTree>(`/api/admin/sites/${siteId}/tree`)
    siteTrees.value[siteId] = response
  } catch (error) {
    console.error('Error loading site tree:', error)
  } finally {
    loadingTrees.value.delete(siteId)
    loadingTrees.value = new Set(loadingTrees.value)
  }
}

async function fetchSites() {
  try {
    const response = await $fetch<{ sites: Site[] }>('/api/admin/sites')
    sites.value = response.sites
  } catch (error) {
    console.error('Error fetching sites:', error)
  }
}

function openCreateModal() {
  isEditing.value = false
  editingId.value = null
  formData.value = {
    code: '',
    name: '',
    description: '',
    address: '',
    isActive: true
  }
  showModal.value = true
}

function openEditModal(site: Site) {
  isEditing.value = true
  editingId.value = site.id
  formData.value = {
    code: site.code,
    name: site.name,
    description: site.description || '',
    address: site.address || '',
    isActive: site.isActive
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function submitForm() {
  loading.value = true
  try {
    if (isEditing.value && editingId.value) {
      await $fetch(`/api/admin/sites/${editingId.value}`, {
        method: 'PUT',
        body: formData.value
      })
    } else {
      await $fetch('/api/admin/sites', {
        method: 'POST',
        body: formData.value
      })
    }
    closeModal()
    await fetchSites()
  } catch (error: any) {
    console.error('Error saving site:', error)
    errorMessage.value = error.data?.message || 'Gagal menyimpan site'
    showErrorModal.value = true
  } finally {
    loading.value = false
  }
}

function confirmDelete(site: Site) {
  siteToDelete.value = site
  showDeleteConfirm.value = true
}

async function deleteSite() {
  if (!siteToDelete.value) return
  
  try {
    await $fetch(`/api/admin/sites/${siteToDelete.value.id}`, {
      method: 'DELETE'
    })
    showDeleteConfirm.value = false
    siteToDelete.value = null
    await fetchSites()
  } catch (error: any) {
    console.error('Error deleting site:', error)
    showDeleteConfirm.value = false
    errorMessage.value = error.data?.message || 'Gagal menghapus site'
    showErrorModal.value = true
  }
}
</script>
