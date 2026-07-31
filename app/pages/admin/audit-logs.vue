<template>
  <NuxtLayout name="admin">
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-ink">Audit Logs</h1>
          <p class="text-sm text-steel mt-1">View system activity and security events</p>
        </div>
        <div class="flex items-center gap-2">
          <USelect
            v-model="filter"
            :items="filterOptions"
            placeholder="All Actions"
            class="w-40"
          />
          <UButton
            @click="loadLogs"
            variant="outline"
            color="neutral"
            icon="i-lucide-refresh-cw"
          />
        </div>
      </div>

      <!-- Logs Table -->
      <div class="bg-canvas rounded-xl border border-hairline shadow-none overflow-hidden">
        <!-- Loading State -->
        <div v-if="loading" class="p-8 text-center">
          <svg class="animate-spin w-8 h-8 mx-auto text-ink" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="mt-2 text-steel">Loading logs...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="logs.length === 0" class="p-8 text-center">
          <svg class="w-12 h-12 mx-auto text-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-steel">No logs found</p>
        </div>

        <!-- Table -->
        <table v-else class="w-full">
          <thead class="bg-surface border-b border-hairline">
            <tr>
              <th class="text-left px-6 py-3 text-xs font-medium text-steel uppercase tracking-wider">Action</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-steel uppercase tracking-wider">Actor</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-steel uppercase tracking-wider">Target</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-steel uppercase tracking-wider">IP Address</th>
              <th class="text-left px-6 py-3 text-xs font-medium text-steel uppercase tracking-wider">Time</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-hairline-soft">
            <tr v-for="log in logs" :key="log.id" class="hover:bg-surface">
              <td class="px-6 py-4">
                <span :class="[
                  'px-2.5 py-1 text-xs font-medium rounded-full',
                  getActionStyle(log.action)
                ]">
                  {{ formatAction(log.action) }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-full bg-surface flex items-center justify-center shrink-0">
                    <span class="text-steel text-sm font-medium">
                      {{ log.actor?.email ? log.actor.email.charAt(0).toUpperCase() : '?' }}
                    </span>
                  </div>
                  <div>
                    <div class="text-sm text-ink">{{ log.actor?.email || log.actor?.type || '-' }}</div>
                    <div v-if="log.actor?.name" class="text-xs text-steel">{{ log.actor.name }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-steel">{{ log.target?.type || '-' }}</td>
              <td class="px-6 py-4 text-sm text-steel font-mono">{{ log.context?.ip || '-' }}</td>
              <td class="px-6 py-4 text-sm text-steel">{{ formatDate(log.at) }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="flex items-center justify-between px-6 py-4 border-t border-hairline bg-surface">
          <p class="text-sm text-steel">
            Showing {{ logs.length }} logs
          </p>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
definePageMeta({
  middleware: ["auth"]
});
const logs = ref([]);
const loading = ref(true);
const filter = ref(null);
const filterOptions = [
  { label: "All Actions", value: null },
  { label: "Login", value: "AUTH_LOGIN" },
  { label: "Logout", value: "AUTH_LOGOUT" },
  { label: "Create", value: "CREATE" },
  { label: "Update", value: "UPDATE" },
  { label: "Delete", value: "DELETE" },
  { label: "OIDC", value: "OIDC" }
];
async function loadLogs() {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (filter.value) params.set("action", filter.value);
    const res = await $fetch(`/api/admin/audit-logs?${params.toString()}`);
    logs.value = res.data || [];
  } catch (error) {
    console.error("Failed to load logs:", error);
  } finally {
    loading.value = false;
  }
}
function formatAction(action) {
  return action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}
function getActionStyle(action) {
  if (action.includes("success")) return "bg-success-bg text-success-text";
  if (action.includes("failed")) return "bg-[#d45656]/10 text-[#d45656]";
  if (action.includes("logout")) return "bg-surface text-charcoal";
  return "bg-surface text-brand-blue-deep";
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
watch(filter, () => {
  loadLogs();
});
onMounted(() => {
  loadLogs();
});
</script>
