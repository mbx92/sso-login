<template>
  <div class="min-h-screen flex items-center justify-center bg-canvas p-4">
    <div class="w-full max-w-md bg-canvas rounded-2xl shadow-mm-2 border border-hairline-soft overflow-hidden">
      <!-- Header -->
      <div class="bg-primary px-6 py-8 text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full overflow-hidden mb-4">
          <img src="/logo.svg" alt="SSO" class="w-16 h-16" />
        </div>
        <h1 class="text-2xl font-bold text-white">SSO Identity Provider</h1>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-6">
        <p class="text-steel text-center">
          Selamat datang di sistem Single Sign-On terpusat.
        </p>

        <div class="space-y-3">
          <NuxtLink
            to="/login"
            class="w-full py-3 px-6 bg-primary active:bg-charcoal text-primary-foreground font-semibold rounded-full shadow-none transition-all duration-150 flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Login
          </NuxtLink>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 bg-surface border-t border-hairline-soft text-center">
        <p class="text-xs text-stone">&copy; {{ new Date().getFullYear() }} SSO System</p>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false
})
</script>
