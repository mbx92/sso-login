<template>
  <NuxtLayout name="admin">
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-ink">Active Sessions</h1>
          <p class="text-sm text-steel mt-1">Monitor users currently logged in to applications</p>
        </div>
        <button
          @click="fetchSessions"
          :disabled="loading"
          class="inline-flex items-center gap-2 px-4 py-2 border border-hairline text-charcoal rounded-lg hover:bg-surface transition-colors disabled:opacity-50"
        >
          <svg v-if="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <!-- Stats Summary -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <!-- Online Now Card -->
        <button 
          @click="showOnlineOnly = !showOnlineOnly"
          :class="[
            'bg-canvas rounded-xl border p-5 shadow-none text-left transition-all',
            showOnlineOnly ? 'border-success-text ring-2 ring-success-text/20' : 'border-hairline active:border-hairline'
          ]"
        >
          <div class="flex items-center gap-4">
            <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-success-bg">
              <div class="relative">
                <svg class="w-6 h-6 text-success-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
                <span class="absolute -top-1 -right-1 w-2 h-2 bg-success-text rounded-full animate-pulse"></span>
              </div>
            </div>
            <div>
              <p class="text-sm font-medium text-steel uppercase tracking-wide">Online Now</p>
              <p class="text-2xl font-semibold text-ink">{{ onlineUsers }}</p>
            </div>
          </div>
          <p class="mt-2 text-xs text-steel">{{ showOnlineOnly ? 'Click to show all' : 'Click to filter' }}</p>
        </button>

        <div class="bg-canvas rounded-xl border border-hairline p-5 shadow-none">
          <div class="flex items-center gap-4">
            <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-surface">
              <svg class="w-6 h-6 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-steel uppercase tracking-wide">Active Users</p>
              <p class="text-2xl font-semibold text-ink">{{ uniqueUsers }}</p>
            </div>
          </div>
        </div>

        <div class="bg-canvas rounded-xl border border-hairline p-5 shadow-none">
          <div class="flex items-center gap-4">
            <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-surface">
              <svg class="w-6 h-6 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-steel uppercase tracking-wide">Total Sessions</p>
              <p class="text-2xl font-semibold text-ink">{{ sessions.length }}</p>
            </div>
          </div>
        </div>

        <div class="bg-canvas rounded-xl border border-hairline p-5 shadow-none">
          <div class="flex items-center gap-4">
            <div class="flex items-center justify-center w-12 h-12 rounded-lg bg-surface">
              <svg class="w-6 h-6 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-steel uppercase tracking-wide">Applications</p>
              <p class="text-2xl font-semibold text-ink">{{ uniqueApps }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Sessions Table -->
      <div class="bg-canvas rounded-xl border border-hairline shadow-none overflow-hidden">
        <div class="px-6 py-4 border-b border-hairline">
          <h3 class="text-lg font-semibold text-ink">Session Details</h3>
        </div>
        
        <div v-if="loading" class="p-8 text-center">
          <svg class="animate-spin w-8 h-8 mx-auto text-stone" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="mt-2 text-steel">Loading sessions...</p>
        </div>

        <div v-else-if="sessions.length === 0" class="p-8 text-center">
          <svg class="w-12 h-12 mx-auto text-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p class="text-steel">No active sessions</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-surface">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-steel uppercase tracking-wider">User</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-steel uppercase tracking-wider">Application</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-steel uppercase tracking-wider">IP Address</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-steel uppercase tracking-wider">Browser</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-steel uppercase tracking-wider">Login Time</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-steel uppercase tracking-wider">Expires</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-steel uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-hairline-soft">
              <tr v-for="session in filteredSessions" :key="session.id" class="hover:bg-surface">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <!-- Avatar with online indicator -->
                    <div class="relative">
                      <div class="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-ink font-semibold">
                        {{ getInitials(session.userName) }}
                      </div>
                      <!-- Online indicator chip -->
                      <span 
                        v-if="session.isOnline" 
                        class="absolute bottom-0 right-0 w-3 h-3 bg-success-text border-2 border-white rounded-full"
                        title="Online"
                      ></span>
                      <span 
                        v-else 
                        class="absolute bottom-0 right-0 w-3 h-3 bg-muted border-2 border-white rounded-full"
                        title="Offline"
                      ></span>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-ink">{{ session.userName }}</p>
                      <p class="text-xs text-steel">{{ session.userEmail }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-surface flex items-center justify-center">
                      <svg class="w-4 h-4 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <span class="text-sm text-ink">{{ session.clientName }}</span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface text-charcoal">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    {{ session.ip }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2" :title="session.userAgent">
                    <svg
                      v-if="getPlatformIconPath(session.userAgent)"
                      class="w-4 h-4 text-steel shrink-0"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path :d="getPlatformIconPath(session.userAgent)" />
                    </svg>
                    <svg
                      v-else
                      class="w-4 h-4 text-steel shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                    </svg>
                    <span class="text-sm text-steel truncate">{{ getBrowserInfo(session.userAgent) }}</span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-ink">{{ formatDateTime(session.loginAt) }}</span>
                </td>
                <td class="px-6 py-4">
                  <span v-if="session.expiresAt" class="text-sm text-steel">
                    {{ formatRelativeTime(session.expiresAt) }}
                  </span>
                  <span v-else class="text-sm text-stone">Never</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <button
                    @click="openRevokeModal(session)"
                    :disabled="revokingId === session.id"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#d45656] bg-[#d45656]/10 rounded-lg hover:bg-[#d45656]/10 transition-colors disabled:opacity-50"
                  >
                    <svg v-if="revokingId === session.id" class="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    Revoke
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Revoke Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showRevokeModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50" @click="closeRevokeModal"></div>
        
        <!-- Modal -->
        <div class="relative bg-canvas rounded-2xl shadow-mm-2 max-w-md w-full mx-4 p-6">
          <!-- Icon -->
          <div class="flex justify-center mb-4">
            <div class="w-16 h-16 rounded-full bg-[#d45656]/10 flex items-center justify-center">
              <svg class="w-8 h-8 text-[#d45656]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          
          <!-- Title -->
          <h3 class="text-lg font-semibold text-ink text-center mb-2">Revoke Session</h3>
          
          <!-- Message -->
          <p class="text-steel text-center mb-6">
            Are you sure you want to revoke the session for <strong class="text-ink">{{ sessionToRevoke?.userName }}</strong>? 
            They will be logged out from <strong class="text-ink">{{ sessionToRevoke?.clientName }}</strong>.
          </p>
          
          <!-- Actions -->
          <div class="flex gap-3">
            <button
              @click="closeRevokeModal"
              class="flex-1 py-2.5 px-4 border border-hairline text-charcoal font-medium rounded-lg hover:bg-surface transition-colors"
            >
              Cancel
            </button>
            <button
              @click="confirmRevoke"
              :disabled="revokingId !== null"
              class="flex-1 py-2.5 px-4 bg-[#d45656] active:bg-[#b33e3e] text-white font-medium rounded-full transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg v-if="revokingId" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Revoke Session
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Error Toast -->
    <Teleport to="body">
      <div v-if="errorMessage" class="fixed bottom-4 right-4 z-50">
        <div class="bg-[#d45656] text-white px-4 py-3 rounded-lg shadow-mm-2 flex items-center gap-3">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ errorMessage }}</span>
          <button @click="errorMessage = ''" class="ml-2 hover:opacity-75">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </Teleport>
  </NuxtLayout>
</template>

<script setup>
definePageMeta({
  middleware: ["auth"]
});
const sessions = ref([]);
const loading = ref(false);
const revokingId = ref(null);
const showRevokeModal = ref(false);
const sessionToRevoke = ref(null);
const errorMessage = ref("");
const showOnlineOnly = ref(false);
const filteredSessions = computed(() => {
  if (showOnlineOnly.value) {
    return sessions.value.filter((s) => s.isOnline);
  }
  return sessions.value;
});
const uniqueUsers = computed(() => {
  return new Set(sessions.value.map((s) => s.userId)).size;
});
const onlineUsers = computed(() => {
  return sessions.value.filter((s) => s.isOnline).length;
});
const uniqueApps = computed(() => {
  return new Set(sessions.value.map((s) => s.clientId)).size;
});
function getInitials(name) {
  return name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2);
}
function getBrowserInfo(userAgent) {
  if (!userAgent || userAgent === "Unknown") return "Unknown";
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari";
  if (userAgent.includes("Edg")) return "Edge";
  if (userAgent.includes("MSIE") || userAgent.includes("Trident")) return "IE";
  return userAgent.substring(0, 30) + "...";
}
// Brand logo paths (viewBox 0 0 24 24) so the Browser column shows a
// recognizable icon instead of cramming OS + browser into truncated text.
const PLATFORM_ICON_PATHS = {
  apple: "M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zm3.024-2.83c.844-1.026 1.415-2.442 1.259-3.87-1.207.052-2.674.808-3.545 1.833-.78.914-1.466 2.375-1.284 3.766 1.36.104 2.75-.688 3.57-1.729z",
  windows: "M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.9H24V24l-13.051-1.351",
  android: "M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4483-.9993.9993-.9993c.5511 0 .9993.4483.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4483.9993.9993 0 .5511-.4483.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1367 1.0989L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3435-4.1021-2.6892-7.5743-6.1185-9.4396"
};
function getPlatform(userAgent) {
  if (!userAgent || userAgent === "Unknown") return null;
  if (/iPhone|iPad|iPod|Macintosh|Mac OS X/.test(userAgent)) return "apple";
  if (/Android/.test(userAgent)) return "android";
  if (/Windows/.test(userAgent)) return "windows";
  return null;
}
function getPlatformIconPath(userAgent) {
  const platform = getPlatform(userAgent);
  return platform ? PLATFORM_ICON_PATHS[platform] : null;
}
function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
function formatRelativeTime(dateStr) {
  const date = new Date(dateStr);
  const now = /* @__PURE__ */ new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 6e4);
  const diffHours = Math.round(diffMs / 36e5);
  const diffDays = Math.round(diffMs / 864e5);
  if (diffMins < 0) return "Expired";
  if (diffMins < 60) return `in ${diffMins}m`;
  if (diffHours < 24) return `in ${diffHours}h`;
  return `in ${diffDays}d`;
}
async function fetchSessions() {
  loading.value = true;
  try {
    const res = await $fetch("/api/admin/sessions");
    sessions.value = res.data || [];
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
  } finally {
    loading.value = false;
  }
}
function openRevokeModal(session) {
  sessionToRevoke.value = session;
  showRevokeModal.value = true;
}
function closeRevokeModal() {
  showRevokeModal.value = false;
  sessionToRevoke.value = null;
}
async function confirmRevoke() {
  if (!sessionToRevoke.value) return;
  const session = sessionToRevoke.value;
  revokingId.value = session.id;
  try {
    await $fetch(`/api/admin/sessions/${session.id}`, { method: "DELETE" });
    sessions.value = sessions.value.filter((s) => s.id !== session.id);
    closeRevokeModal();
  } catch (error) {
    console.error("Failed to revoke session:", error);
    errorMessage.value = "Failed to revoke session. Please try again.";
    setTimeout(() => {
      errorMessage.value = "";
    }, 5e3);
  } finally {
    revokingId.value = null;
  }
}
onMounted(() => {
  fetchSessions();
});
</script>
