<template>
  <NuxtLayout name="admin">
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-ink">User Access</h1>
          <p class="text-sm text-steel mt-1">Manage user access to OIDC clients</p>
        </div>
        <button
          @click="showGrantModal = true"
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary active:bg-charcoal text-primary-foreground rounded-full transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Grant Access
        </button>
      </div>

      <!-- Access List -->
      <div class="bg-canvas rounded-xl border border-hairline shadow-none overflow-hidden">
        <!-- Loading State -->
        <div v-if="loading" class="p-8 text-center">
          <svg class="animate-spin w-8 h-8 mx-auto text-ink" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="mt-2 text-steel">Loading access records...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="accessList.length === 0" class="p-8 text-center">
          <svg class="w-12 h-12 mx-auto text-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h3 class="text-lg font-medium text-ink mb-2">No access records</h3>
          <p class="text-steel mb-4">Grant access to users for specific clients</p>
        </div>

        <!-- Table -->
        <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-surface border-b border-hairline">
            <tr>
              <th class="text-left px-6 py-3 text-xs font-medium text-steel uppercase tracking-wider">User</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-steel uppercase tracking-wider">Client</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-steel uppercase tracking-wider">Granted By</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-steel uppercase tracking-wider">Granted At</th>
              <th class="text-right px-6 py-3 text-xs font-medium text-steel uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-hairline-soft">
            <tr v-for="access in accessList" :key="access.id" class="hover:bg-surface">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-surface flex items-center justify-center shrink-0">
                    <span class="text-ink text-sm font-medium">{{ (access.userName || access.userEmail || '?').charAt(0).toUpperCase() }}</span>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-ink">{{ access.userName || '-' }}</p>
                    <p class="text-xs text-steel">{{ access.userEmail || '-' }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-ink">{{ access.clientName || access.clientId }}</span>
              </td>
              <td class="px-6 py-4 text-sm text-steel">{{ access.grantedByEmail || '-' }}</td>
              <td class="px-6 py-4 text-sm text-steel">{{ formatDate(access.grantedAt) }}</td>
              <td class="px-6 py-4 text-right">
                <button
                  @click="revokeAccess(access)"
                  class="text-[#d45656] hover:text-[#d45656] text-sm font-medium"
                >
                  Revoke
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>

      <!-- Grant Access Modal -->
      <div v-if="showGrantModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="closeGrantModal"></div>
        <div class="relative bg-canvas rounded-2xl shadow-mm-2 w-full max-w-md">
          <div class="px-6 py-4 border-b border-hairline">
            <h3 class="text-lg font-semibold text-ink">Grant Access</h3>
          </div>
          <form @submit.prevent="grantAccess" class="p-6 space-y-4">
            <!-- User Search Input with Nuxt UI InputMenu -->
            <div>
              <label class="block text-sm font-medium text-charcoal mb-2">User</label>
              <UInputMenu
                v-model="selectedUser"
                v-model:search-term="userSearchTerm"
                :items="userItems"
                :loading="isSearching"
                ignore-filter
                placeholder="Ketik nama, email, atau NIK..."
                icon="i-lucide-user"
                :filter-fields="['label', 'email', 'employeeId']"
                class="w-full"
                value-key="id"
              >
                <template #item-label="{ item }">
                  <div class="flex flex-col">
                    <span>{{ item.label }}</span>
                    <span class="text-xs text-steel">{{ item.email }}{{ item.employeeId ? ` · ${item.employeeId}` : '' }}</span>
                  </div>
                </template>
              </UInputMenu>
            </div>
            
            <!-- Client Select with Nuxt UI Select -->
            <div>
              <label class="block text-sm font-medium text-charcoal mb-2">Client</label>
              <USelect
                v-model="grantForm.clientId"
                :items="clientItems"
                placeholder="Pilih client..."
                value-key="value"
                class="w-full"
              />
            </div>
            
            <div class="flex gap-3 pt-4">
              <UButton
                type="button"
                variant="outline"
                color="neutral"
                class="flex-1"
                @click="closeGrantModal"
              >
                Cancel
              </UButton>
              <UButton
                type="submit"
                :disabled="saving || !selectedUser || !grantForm.clientId"
                :loading="saving"
                color="primary"
                class="flex-1"
              >
                Grant Access
              </UButton>
            </div>
          </form>
        </div>
      </div>

      <!-- Revoke Confirmation Modal -->
      <ConfirmModal
        :isOpen="showRevokeModal"
        title="Revoke Access"
        :message="`Are you sure you want to revoke access for '${accessToRevoke?.userName || accessToRevoke?.userEmail}' to '${accessToRevoke?.clientName}'?`"
        type="danger"
        confirmText="Revoke"
        cancelText="Cancel"
        @confirm="doRevokeAccess"
        @cancel="showRevokeModal = false"
      />
    </div>
  </NuxtLayout>
</template>

<script setup>
import { refDebounced } from "@vueuse/core";
definePageMeta({
  middleware: ["auth"]
});
const accessList = ref([]);
const clients = ref([]);
const loading = ref(true);
const saving = ref(false);
const showGrantModal = ref(false);
const showRevokeModal = ref(false);
const accessToRevoke = ref(null);
const userSearchTerm = ref("");
const userSearchTermDebounced = refDebounced(userSearchTerm, 300);
const userItems = ref([]);
const selectedUser = ref(null);
const isSearching = ref(false);
const grantForm = ref({
  clientId: ""
});
const clientItems = computed(() => {
  return clients.value.map((client) => ({
    label: client.clientName || client.name || client.clientId,
    value: client.id
  }));
});
watch(userSearchTermDebounced, async (searchTerm) => {
  if (!searchTerm || searchTerm.length < 2) {
    userItems.value = [];
    isSearching.value = false;
    return;
  }
  isSearching.value = true;
  try {
    const res = await $fetch(`/api/admin/users?search=${encodeURIComponent(searchTerm)}&limit=10`);
    const users = res.data || [];
    userItems.value = users.map((user) => ({
      id: user.id,
      label: user.name,
      email: user.email,
      employeeId: user.employeeId
    }));
  } catch (error) {
    console.error("Search error:", error);
    userItems.value = [];
  } finally {
    isSearching.value = false;
  }
});
async function loadData() {
  loading.value = true;
  try {
    const [accessRes, clientsRes] = await Promise.all([
      $fetch("/api/admin/user-access"),
      $fetch("/api/admin/clients")
    ]);
    accessList.value = accessRes.data || [];
    clients.value = clientsRes.data || clientsRes.clients || [];
  } catch (error) {
    console.error("Failed to load data:", error);
  } finally {
    loading.value = false;
  }
}
function closeGrantModal() {
  showGrantModal.value = false;
  selectedUser.value = null;
  userSearchTerm.value = "";
  userItems.value = [];
  grantForm.value.clientId = "";
}
async function grantAccess() {
  if (!selectedUser.value) return;
  saving.value = true;
  try {
    await $fetch("/api/admin/user-access", {
      method: "POST",
      body: {
        userId: selectedUser.value.id,
        clientId: grantForm.value.clientId
      }
    });
    closeGrantModal();
    await loadData();
  } catch (error) {
    console.error("Failed to grant access:", error);
  } finally {
    saving.value = false;
  }
}
function revokeAccess(access) {
  accessToRevoke.value = access;
  showRevokeModal.value = true;
}
async function doRevokeAccess() {
  if (!accessToRevoke.value) return;
  try {
    await $fetch(`/api/admin/user-access/${accessToRevoke.value.id}`, {
      method: "DELETE"
    });
    showRevokeModal.value = false;
    accessToRevoke.value = null;
    await loadData();
  } catch (error) {
    console.error("Failed to revoke access:", error);
  }
}
function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
onMounted(() => {
  loadData();
});
</script>
