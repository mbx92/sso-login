<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
      <div class="text-center">
        <!-- Access Denied Icon -->
        <div class="flex justify-center mb-4">
          <div class="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
            <svg class="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <h1 class="text-2xl font-bold text-red-600">Akses Ditolak</h1>
        
        <p class="text-gray-600 mt-2">
          Anda tidak memiliki akses ke aplikasi <strong class="text-gray-900">{{ clientName }}</strong>.
        </p>

        <!-- Warning Alert -->
        <div class="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 text-left">
          <svg class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p class="font-medium text-amber-800">Perhatian</p>
            <p class="text-sm text-amber-700">Hubungi administrator untuk mendapatkan akses ke aplikasi ini.</p>
          </div>
        </div>

        <!-- Divider -->
        <div class="my-6 border-t border-gray-200"></div>

        <div class="flex justify-center">
          <button
            @click="goBack"
            class="py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const route = useRoute()
const router = useRouter()

const clientName = computed(() => {
  return (route.query.client_name as string) || 'Aplikasi'
})

function clearAllCookies() {
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const eqPos = cookie.indexOf('=')
    const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim()
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
  }
}

async function goBack() {
  try {
    // Call logout API to clear httpOnly sso_session cookie
    await $fetch('/api/auth/logout', { method: 'POST' })
  } catch (e) {
    // Ignore errors, continue with cleanup
    console.error('Logout API error:', e)
  }
  
  // Clear all client-accessible cookies
  clearAllCookies()
  
  // Clear session storage
  sessionStorage.clear()
  
  // Clear local storage as well
  localStorage.clear()
  
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>
