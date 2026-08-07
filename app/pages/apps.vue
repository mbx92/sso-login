<template>
  <div class="min-h-screen bg-surface">
    <header class="border-b border-hairline bg-canvas">
      <div class="mx-auto flex h-16 max-w-[1100px] items-center justify-between gap-3 px-4 sm:px-6">
        <AppLogo :size="32" show-label label="SSO Portal" />
        <div class="flex items-center gap-3">
          <div class="hidden text-right sm:block">
            <p class="text-[13px] font-semibold text-ink">{{ user?.name || 'User' }}</p>
            <p class="text-[12px] text-steel">{{ user?.email }}</p>
          </div>
          <NuxtLink
            v-if="user?.isAdmin"
            to="/admin"
            class="rounded-full border border-hairline px-4 py-2 text-[13px] font-semibold text-ink hover:bg-surface"
          >
            Admin
          </NuxtLink>
          <NuxtLink
            to="/logout"
            class="rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground active:bg-charcoal"
          >
            Logout
          </NuxtLink>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 sm:py-10">
      <div class="mb-8">
        <h1 class="text-heading-sm text-ink">Aplikasi Anda</h1>
        <p class="mt-2 text-[15px] text-steel">
          Pilih aplikasi yang terhubung dengan akun SSO Anda. Klik kartu untuk masuk tanpa isi password lagi.
        </p>
      </div>

      <div v-if="loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 3" :key="i" class="h-36 animate-pulse rounded-xl border border-hairline bg-canvas" />
      </div>

      <div
        v-else-if="apps.length === 0"
        class="rounded-xl border border-hairline bg-canvas px-8 py-16 text-center"
      >
        <div class="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-surface">
          <LayoutGrid class="size-6 text-steel" />
        </div>
        <h2 class="text-[18px] font-semibold text-ink">Belum ada aplikasi</h2>
        <p class="mt-2 text-[14px] text-steel">
          Hubungi administrator untuk mendapatkan akses ke aplikasi.
        </p>
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <a
          v-for="app in apps"
          :key="app.id"
          :href="app.homepageUrl"
          class="group rounded-xl border border-hairline bg-canvas p-5 shadow-none transition-all hover:border-ink/20 hover:shadow-mm-1"
        >
          <div class="mb-4 flex items-start justify-between gap-3">
            <div class="flex size-11 items-center justify-center rounded-full bg-ink text-white">
              <span class="text-[15px] font-semibold">{{ appInitial(app.name) }}</span>
            </div>
            <ExternalLink class="size-4 text-stone opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <h3 class="text-[16px] font-semibold text-ink">{{ app.name }}</h3>
          <p class="mt-1 line-clamp-2 text-[13px] text-steel">
            {{ app.description || app.homepageUrl }}
          </p>
          <p class="mt-4 text-[12px] font-medium text-ink">Buka aplikasi →</p>
        </a>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ExternalLink, LayoutGrid } from '@lucide/vue'

definePageMeta({
  layout: false,
  middleware: ['auth'],
})

const user = ref(null)
const apps = ref([])
const loading = ref(true)

function appInitial(name) {
  return (name || '?').trim().charAt(0).toUpperCase()
}

onMounted(async () => {
  try {
    const res = await $fetch('/api/me/apps')
    user.value = res.user
    apps.value = res.apps || []
  } catch (error) {
    console.error('Failed to load apps:', error)
    if (error?.statusCode === 401) {
      await navigateTo('/login?reason=session_expired')
    }
  } finally {
    loading.value = false
  }
})
</script>
