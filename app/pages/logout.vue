<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
    <div class="text-center">
      <span class="loading loading-spinner loading-lg text-primary"></span>
      <p class="mt-4 text-base-content/60">Logging out...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

onMounted(async () => {
  try {
    // Call logout API
    await $fetch('/api/auth/logout', { 
      method: 'POST',
      credentials: 'include'
    })
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    // Always redirect to login page
    window.location.href = '/login'
  }
})
</script>
