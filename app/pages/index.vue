<template>
  <div class="min-h-screen flex items-center justify-center bg-canvas p-4">
    <div class="w-full max-w-md bg-canvas rounded-2xl shadow-mm-2 border border-hairline-soft overflow-hidden">
      <!-- Header -->
      <div class="bg-primary px-6 py-8 text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-canvas/20 mb-4">
          <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
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

        <!-- Divider -->
        <div class="flex items-center gap-3">
          <div class="flex-1 border-t border-hairline"></div>
          <span class="text-sm text-stone">Info Teknis</span>
          <div class="flex-1 border-t border-hairline"></div>
        </div>

        <div class="text-sm text-steel bg-surface p-4 rounded-lg">
          <p class="font-medium mb-2">OIDC Discovery Endpoint:</p>
          <a
            href="/.well-known/openid-configuration"
            target="_blank"
            class="text-ink hover:underline break-all flex items-center gap-1"
          >
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            /.well-known/openid-configuration
          </a>
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
});
</script>
