<template>
  <div class="min-h-screen bg-base-200 flex items-center justify-center">
    <div class="card w-96 bg-base-100 shadow-xl">
      <div class="card-body text-center">
        <h1 class="text-3xl font-bold mb-4">SSO Identity Provider</h1>
        <p class="mb-6">Selamat datang di sistem Single Sign-On</p>
        
        <div class="space-y-3">
          <NuxtLink to="/login" class="btn btn-primary btn-block">
            Login
          </NuxtLink>
          
          <NuxtLink to="/admin" class="btn btn-outline btn-block">
            Admin Panel
          </NuxtLink>
        </div>

        <div class="divider">Info</div>
        
        <div class="text-sm text-base-content/60 space-y-2">
          <p>OIDC Discovery Endpoint:</p>
          <a 
            href="/.well-known/openid-configuration" 
            target="_blank"
            class="link link-primary text-xs"
          >
            /.well-known/openid-configuration
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})
</script>
