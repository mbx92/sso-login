<template>
  <NuxtLayout name="admin">
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-ink">Roles & Permissions</h1>
          <p class="text-sm text-steel mt-1">Kelola role dan hak akses pengguna</p>
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
        <div v-for="i in 3" :key="i" class="bg-canvas rounded-xl border border-hairline p-6 animate-pulse">
          <div class="h-4 bg-hairline rounded w-3/4 mb-4"></div>
          <div class="h-3 bg-hairline rounded w-1/2 mb-3"></div>
          <div class="h-3 bg-hairline rounded w-full"></div>
        </div>
      </div>

      <div v-else-if="roles.length === 0" class="bg-canvas rounded-xl border border-hairline p-12 text-center">
        <svg class="w-12 h-12 mx-auto text-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3 class="text-lg font-medium text-ink mb-2">Belum ada role</h3>
        <p class="text-steel mb-4">Buat role pertama untuk mengatur hak akses</p>
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
          class="bg-canvas rounded-xl border border-hairline p-6 hover:shadow-mm-1 transition-shadow"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div :class="[
                'w-10 h-10 rounded-lg flex items-center justify-center',
                role.isSystem ? 'bg-brand-blue-200' : 'bg-surface'
              ]">
                <svg :class="[
                  'w-5 h-5',
                  role.isSystem ? 'text-brand-blue-deep' : 'text-ink'
                ]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-ink">{{ role.name }}</h3>
                <p class="text-xs text-steel">
                  {{ role.siteName || 'Global' }}
                  <span v-if="role.isSystem" class="ml-1 text-brand-blue-deep">(Sistem)</span>
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
          
          <p v-if="role.description" class="text-sm text-steel mb-3">{{ role.description }}</p>
          
          <div class="flex flex-wrap gap-1">
            <span 
              v-for="perm in (role.permissions || []).slice(0, 5)" 
              :key="perm"
              class="px-2 py-0.5 text-xs bg-surface text-charcoal rounded"
            >
              {{ formatPermission(perm) }}
            </span>
            <span 
              v-if="(role.permissions || []).length > 5"
              class="px-2 py-0.5 text-xs bg-surface text-charcoal rounded"
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
          <div class="relative bg-canvas rounded-xl shadow-mm-2 max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div class="px-6 py-4 border-b border-hairline">
              <h3 class="text-lg font-semibold text-ink">
                {{ showEditModal ? 'Edit Role' : 'Tambah Role Baru' }}
              </h3>
            </div>
            
            <div class="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label class="block text-sm font-medium text-charcoal mb-1">Nama Role *</label>
                <UInput
                  v-model="form.name"
                  placeholder="Contoh: Admin Site"
                  class="w-full"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-charcoal mb-1">Deskripsi</label>
                <UTextarea
                  v-model="form.description"
                  :rows="2"
                  placeholder="Deskripsi role ini..."
                  class="w-full"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-charcoal mb-1">Site (opsional)</label>
                <USelect
                  v-model="form.siteId"
                  :items="siteOptions"
                  placeholder="Global (Semua Site)"
                  class="w-full"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-charcoal mb-3">Permissions</label>
                
                <div class="space-y-4">
                  <div v-for="category in permissionCategories" :key="category.name" class="border border-hairline rounded-lg p-4">
                    <div class="flex items-center justify-between mb-3">
                      <h4 class="font-medium text-ink capitalize">{{ category.name }}</h4>
                      <button
                        @click="toggleCategory(category.name)"
                        class="text-xs text-ink hover:text-ink"
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
            
            <div class="px-6 py-4 border-t border-hairline flex justify-end gap-3">
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
    </div>
  </NuxtLayout>
</template>

<script setup>
definePageMeta({
  middleware: ["auth"]
});
const roles = ref([]);
const sites = ref([]);
const availablePermissions = ref([]);
const loading = ref(true);
const saving = ref(false);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const showErrorModal = ref(false);
const errorMessage = ref("");
const editingRole = ref(null);
const roleToDelete = ref(null);
const form = ref({
  name: "",
  description: "",
  permissions: [],
  siteId: null
});
const siteOptions = computed(() => {
  return [
    { label: "Global (Semua Site)", value: null },
    ...sites.value.map((s) => ({ label: s.name, value: s.id }))
  ];
});
const permissionCategories = computed(() => {
  const categories = {};
  availablePermissions.value.forEach((perm) => {
    if (!categories[perm.category]) {
      categories[perm.category] = [];
    }
    categories[perm.category].push(perm);
  });
  return Object.entries(categories).map(([name, permissions]) => ({
    name,
    permissions
  }));
});
function isCategoryFullySelected(category) {
  const categoryPerms = availablePermissions.value.filter((p) => p.category === category);
  return categoryPerms.every((p) => form.value.permissions.includes(p.value));
}
function toggleCategory(category) {
  const categoryPerms = availablePermissions.value.filter((p) => p.category === category);
  const allSelected = isCategoryFullySelected(category);
  if (allSelected) {
    form.value.permissions = form.value.permissions.filter(
      (p) => !categoryPerms.some((cp) => cp.value === p)
    );
  } else {
    const toAdd = categoryPerms.filter((p) => !form.value.permissions.includes(p.value));
    form.value.permissions.push(...toAdd.map((p) => p.value));
  }
}
function formatPermission(perm) {
  const parts = perm.split(".");
  return `${parts[0]}: ${parts[1]}`;
}
async function loadRoles() {
  loading.value = true;
  try {
    const res = await $fetch("/api/admin/roles");
    roles.value = res.data || [];
    availablePermissions.value = res.permissions || [];
  } catch (error) {
    console.error("Failed to load roles:", error);
  } finally {
    loading.value = false;
  }
}
async function loadSites() {
  try {
    const res = await $fetch("/api/admin/sites");
    sites.value = res.sites || [];
  } catch (error) {
    console.error("Failed to load sites:", error);
  }
}
function closeModal() {
  showCreateModal.value = false;
  showEditModal.value = false;
  form.value = {
    name: "",
    description: "",
    permissions: [],
    siteId: null
  };
  editingRole.value = null;
}
function editRole(role) {
  editingRole.value = role;
  form.value = {
    name: role.name,
    description: role.description || "",
    permissions: [...role.permissions || []],
    siteId: role.siteId
  };
  showEditModal.value = true;
}
function confirmDelete(role) {
  roleToDelete.value = role;
  showDeleteModal.value = true;
}
async function createRole() {
  if (!form.value.name.trim()) {
    errorMessage.value = "Nama role wajib diisi";
    showErrorModal.value = true;
    return;
  }
  saving.value = true;
  try {
    await $fetch("/api/admin/roles", {
      method: "POST",
      body: form.value
    });
    closeModal();
    await loadRoles();
  } catch (error) {
    errorMessage.value = error.data?.message || "Gagal membuat role";
    showErrorModal.value = true;
  } finally {
    saving.value = false;
  }
}
async function updateRole() {
  if (!editingRole.value) return;
  saving.value = true;
  try {
    await $fetch(`/api/admin/roles/${editingRole.value.id}`, {
      method: "PUT",
      body: form.value
    });
    closeModal();
    await loadRoles();
  } catch (error) {
    errorMessage.value = error.data?.message || "Gagal mengupdate role";
    showErrorModal.value = true;
  } finally {
    saving.value = false;
  }
}
async function deleteRole() {
  if (!roleToDelete.value) return;
  try {
    await $fetch(`/api/admin/roles/${roleToDelete.value.id}`, {
      method: "DELETE"
    });
    showDeleteModal.value = false;
    roleToDelete.value = null;
    await loadRoles();
  } catch (error) {
    showDeleteModal.value = false;
    errorMessage.value = error.data?.message || "Gagal menghapus role";
    showErrorModal.value = true;
  }
}
onMounted(() => {
  loadRoles();
  loadSites();
});
</script>
