<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-ink">Master Unit</h1>
        <p class="text-sm text-steel mt-1">Kelola data unit organisasi</p>
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
        class="flex-1 min-w-0 sm:min-w-[28rem]"
      />
      <USelect
        v-model="filterDivision"
        :items="divisionFilterItems"
        placeholder="Semua Divisi"
        class="w-full sm:w-[220px]"
      />
    </div>

    <!-- Table -->
    <div class="bg-canvas rounded-xl border border-hairline shadow-none overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-hairline-soft">
          <thead class="bg-surface">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-steel uppercase tracking-wider">Kode</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-steel uppercase tracking-wider">Nama Unit</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-steel uppercase tracking-wider">Divisi</th>
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
            <tr v-else-if="filteredUnits.length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-steel">
                Tidak ada data unit
              </td>
            </tr>
            <tr v-for="unit in filteredUnits" :key="unit.id" class="hover:bg-surface">
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="font-mono text-sm text-ink">{{ unit.code }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm font-medium text-ink">{{ unit.name }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-steel">{{ unit.divisionName || '-' }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                    unit.isActive
                      ? 'bg-success-bg text-success-text'
                      : 'bg-surface text-charcoal'
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
        <div class="relative bg-canvas rounded-xl shadow-mm-2 max-w-md w-full p-6">
          <h3 class="text-lg font-semibold text-ink mb-4">
            {{ editingUnit ? 'Edit Unit' : 'Tambah Unit Baru' }}
          </h3>
          <form @submit.prevent="saveUnit">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-charcoal mb-1">Divisi</label>
                <USelect
                  v-model="form.divisionId"
                  :items="divisionOptions"
                  placeholder="Pilih Divisi"
                  :ui="{ base: 'w-full' }"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-charcoal mb-1">Kode Unit</label>
                <UInput
                  v-model="form.code"
                  placeholder="UNIT001"
                  required
                  :ui="{ root: 'w-full' }"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-charcoal mb-1">Nama Unit</label>
                <UInput
                  v-model="form.name"
                  placeholder="Nama unit"
                  required
                  :ui="{ root: 'w-full' }"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-charcoal mb-1">Deskripsi</label>
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
        <div class="relative bg-canvas rounded-xl shadow-mm-2 max-w-sm w-full p-6">
          <h3 class="text-lg font-semibold text-ink mb-2">Hapus Unit</h3>
          <p class="text-steel mb-6">
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
const units = ref([]);
const divisions = ref([]);
const loading = ref(true);
const searchQuery = ref("");
const filterDivision = ref(null);
const showModal = ref(false);
const showDeleteModal = ref(false);
const saving = ref(false);
const deleting = ref(false);
const editingUnit = ref(null);
const deletingUnit = ref(null);
const form = ref({
  code: "",
  name: "",
  description: "",
  divisionId: "",
  siteId: "",
  isActive: true
});
const filteredUnits = computed(() => {
  let result = units.value;
  if (filterDivision.value) {
    result = result.filter((u) => u.divisionId === filterDivision.value);
  }
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (u) => u.code.toLowerCase().includes(query) || u.name.toLowerCase().includes(query)
    );
  }
  return result;
});
const divisionFilterItems = computed(() => {
  return [
    { label: "Semua Divisi", value: null },
    ...divisions.value.map((d) => ({ label: d.name, value: d.id }))
  ];
});
const divisionOptions = computed(() => {
  return divisions.value.map((d) => ({ label: d.name, value: d.id }));
});
async function fetchData() {
  loading.value = true;
  try {
    const [unitsResponse, divisionsResponse] = await Promise.all([
      $fetch("/api/admin/units"),
      $fetch("/api/admin/divisions")
    ]);
    units.value = unitsResponse.units;
    divisions.value = divisionsResponse.divisions;
  } catch (error) {
    console.error("Failed to fetch data:", error);
  } finally {
    loading.value = false;
  }
}
function openCreateModal() {
  editingUnit.value = null;
  const siteIdFromUser = currentUser.value?.siteId || "";
  form.value = { code: "", name: "", description: "", divisionId: "", siteId: siteIdFromUser, isActive: true };
  showModal.value = true;
}
function openEditModal(unit) {
  editingUnit.value = unit;
  form.value = {
    code: unit.code,
    name: unit.name,
    description: unit.description || "",
    divisionId: unit.divisionId,
    siteId: unit.siteId || currentUser.value?.siteId || "",
    isActive: unit.isActive
  };
  showModal.value = true;
}
function closeModal() {
  showModal.value = false;
  editingUnit.value = null;
}
async function saveUnit() {
  if (form.value.divisionId && !form.value.siteId) {
    const selectedDivision = divisions.value.find((d) => d.id === form.value.divisionId);
    if (selectedDivision?.siteId) {
      form.value.siteId = selectedDivision.siteId;
    }
  }
  if (!form.value.siteId && currentUser.value?.siteId) {
    form.value.siteId = currentUser.value.siteId;
  }
  saving.value = true;
  try {
    if (editingUnit.value) {
      await $fetch(`/api/admin/units/${editingUnit.value.id}`, {
        method: "PUT",
        body: form.value
      });
    } else {
      await $fetch("/api/admin/units", {
        method: "POST",
        body: form.value
      });
    }
    closeModal();
    await fetchData();
  } catch (error) {
    alert(error.data?.message || "Gagal menyimpan unit");
  } finally {
    saving.value = false;
  }
}
function confirmDelete(unit) {
  deletingUnit.value = unit;
  showDeleteModal.value = true;
}
async function deleteUnit() {
  if (!deletingUnit.value) return;
  deleting.value = true;
  try {
    await $fetch(`/api/admin/units/${deletingUnit.value.id}`, {
      method: "DELETE"
    });
    showDeleteModal.value = false;
    await fetchData();
  } catch (error) {
    alert(error.data?.message || "Gagal menghapus unit");
  } finally {
    deleting.value = false;
  }
}
onMounted(() => {
  fetchData();
});
</script>
