<template>
  <div class="min-h-screen flex items-center justify-center bg-base-200">
    <div class="card bg-base-100 shadow-xl max-w-md w-full mx-4">
      <div class="card-body text-center">
        <!-- Access Denied Icon -->
        <div class="flex justify-center mb-4">
          <div class="w-20 h-20 rounded-full bg-error/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
        </div>

        <h1 class="text-2xl font-bold text-error">Akses Ditolak</h1>
        
        <p class="text-base-content/70 mt-2">
          Anda tidak memiliki akses ke aplikasi <strong class="text-base-content">{{ clientName }}</strong>.
        </p>

        <div class="alert alert-warning mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Hubungi administrator untuk mendapatkan akses ke aplikasi ini.</span>
        </div>

        <div class="divider"></div>

        <div class="card-actions justify-center">
          <button @click="goBack" class="btn btn-outline btn-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali
          </button>
          <NuxtLink to="/" class="btn btn-primary btn-sm">
            Ke Dashboard
          </NuxtLink>
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

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>
