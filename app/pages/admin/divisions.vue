<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-ink">Master Divisi</h1>
        <p class="text-sm text-steel mt-1">Kelola data divisi organisasi</p>
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
        class="w-full max-w-2xl"
      />
    </div>

    <!-- Table -->
    <div class="bg-canvas rounded-xl border border-hairline shadow-none overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-hairline-soft">
          <thead class="bg-surface">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-steel uppercase tracking-wider">Kode</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-steel uppercase tracking-wider">Nama Divisi</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-steel uppercase tracking-wider">Deskripsi</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-steel uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-steel uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody class="bg-canvas divide-y divide-hairline-soft">
            <tr v-if="loading">
              <td colspan="5" class="px-6 py-12 text-center">
                <div class="flex items-center justify-center gap-2 text-steel">
                  <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memuat data...
                </div>
              </td>
            </tr>
            <tr v-else-if="filteredDivisions.length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-steel">
                Tidak ada data divisi
              </td>
            </tr>
            <tr v-for="division in filteredDivisions" :key="division.id" class="hover:bg-surface">
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="font-mono text-sm text-ink">{{ division.code }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm font-medium text-ink">{{ division.name }}</span>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-steel">{{ division.description || '-' }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                    division.isActive
                      ? 'bg-success-bg text-success-text'
                      : 'bg-surface text-charcoal'
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
        <div class="relative bg-canvas rounded-xl shadow-mm-2 max-w-md w-full p-6">
          <h3 class="text-lg font-semibold text-ink mb-4">
            {{ editingDivision ? 'Edit Divisi' : 'Tambah Divisi Baru' }}
          </h3>
          <form @submit.prevent="saveDivision">
            <div class="space-y-4">
              <!-- Site Selector for Superadmin -->
              <div v-if="isSuperAdmin">
                <label class="block text-sm font-medium text-charcoal mb-1">Site</label>
                <USelect
                  v-model="form.siteId"
                  :items="siteOptions"
                  placeholder="Pilih Site"
                  :ui="{ base: 'w-full' }"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-charcoal mb-1">Kode Divisi</label>
                <UInput
                  v-model="form.code"
                  placeholder="DIV001"
                  required
                  :ui="{ root: 'w-full' }"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-charcoal mb-1">Nama Divisi</label>
                <UInput
                  v-model="form.name"
                  placeholder="Nama divisi"
                  required
                  :ui="{ root: 'w-full' }"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-charcoal mb-1">Deskripsi</label>
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

<script setup>
definePageMeta({
  layout: "admin",
  middleware: ["auth"]
});
const userCookie = useCookie("sso_user");
const currentUser = computed(() => {
  if (!userCookie.value) return null;
  try {
    if (typeof userCookie.value === "string") {
      return JSON.parse(userCookie.value);
    }
    return userCookie.value;
  } catch {
    return null;
  }
});
const divisions = ref([]);
const loading = ref(true);
const searchQuery = ref("");
const showModal = ref(false);
const showDeleteModal = ref(false);
const saving = ref(false);
const deleting = ref(false);
const editingDivision = ref(null);
const deletingDivision = ref(null);
const isSuperAdmin = computed(() => {
  const user = currentUser.value
  if (!user) return false
  if (Array.isArray(user.roles) && user.roles.includes("superadmin")) return true
  return user.roleId === "superadmin" || user.roleName?.toLowerCase?.() === "superadmin"
});
const userSiteId = computed(() => currentUser.value?.siteId || "");
const sites = ref([]);
const form = ref({
  siteId: "",
  code: "",
  name: "",
  description: "",
  isActive: true
});
watch(userSiteId, (newSiteId) => {
  if (newSiteId && !form.value.siteId) {
    form.value.siteId = newSiteId;
  }
}, { immediate: true });
const siteOptions = computed(() => {
  return sites.value.map((s) => ({ label: s.name, value: s.id }));
});
const showErrorModal = ref(false);
const errorType = ref("error");
const errorTitle = ref("");
const errorMessage = ref("");
function showError(title, message, type = "error") {
  errorTitle.value = title;
  errorMessage.value = message;
  errorType.value = type;
  showErrorModal.value = true;
}
const filteredDivisions = computed(() => {
  if (!searchQuery.value) return divisions.value;
  const query = searchQuery.value.toLowerCase();
  return divisions.value.filter(
    (d) => d.code.toLowerCase().includes(query) || d.name.toLowerCase().includes(query)
  );
});
async function fetchSites() {
  if (!isSuperAdmin.value) return;
  try {
    const response = await $fetch("/api/admin/sites");
    sites.value = response.sites;
  } catch (error) {
    console.error("Failed to fetch sites:", error);
  }
}
async function fetchDivisions() {
  loading.value = true;
  try {
    const response = await $fetch("/api/admin/divisions");
    divisions.value = response.divisions;
  } catch (error) {
    console.error("Failed to fetch divisions:", error);
  } finally {
    loading.value = false;
  }
}
function openCreateModal() {
  editingDivision.value = null;
  const siteIdFromUser = currentUser.value?.siteId || "";
  form.value = {
    siteId: siteIdFromUser,
    code: "",
    name: "",
    description: "",
    isActive: true
  };
  showModal.value = true;
}
function openEditModal(division) {
  editingDivision.value = division;
  form.value = {
    siteId: division.siteId || userSiteId.value || "",
    code: division.code,
    name: division.name,
    description: division.description || "",
    isActive: division.isActive
  };
  showModal.value = true;
}
function closeModal() {
  showModal.value = false;
  editingDivision.value = null;
}
async function saveDivision() {
  const siteId = form.value.siteId || currentUser.value?.siteId || "";
  if (!siteId) {
    showError("Validasi Gagal", "Silakan pilih site terlebih dahulu", "warning");
    return;
  }
  saving.value = true;
  try {
    const payload = {
      ...form.value,
      siteId
    };
    if (editingDivision.value) {
      await $fetch(`/api/admin/divisions/${editingDivision.value.id}`, {
        method: "PUT",
        body: payload
      });
      showError("Berhasil", "Divisi berhasil diperbarui", "success");
    } else {
      await $fetch("/api/admin/divisions", {
        method: "POST",
        body: payload
      });
      showError("Berhasil", "Divisi berhasil dibuat", "success");
    }
    closeModal();
    await fetchDivisions();
  } catch (error) {
    showError("Gagal Menyimpan", error.data?.message || "Terjadi kesalahan saat menyimpan divisi", "error");
  } finally {
    saving.value = false;
  }
}
function confirmDelete(division) {
  deletingDivision.value = division;
  showDeleteModal.value = true;
}
async function deleteDivision() {
  if (!deletingDivision.value) return;
  deleting.value = true;
  try {
    await $fetch(`/api/admin/divisions/${deletingDivision.value.id}`, {
      method: "DELETE"
    });
    showDeleteModal.value = false;
    showError("Berhasil", "Divisi berhasil dihapus", "success");
    await fetchDivisions();
  } catch (error) {
    showError("Gagal Menghapus", error.data?.message || "Terjadi kesalahan saat menghapus divisi", "error");
  } finally {
    deleting.value = false;
  }
}
onMounted(() => {
  fetchSites();
  fetchDivisions();
});
</script>
