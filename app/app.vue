<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Toaster rich-colors position="top-right" />
  </div>
</template>

<script setup>
import { Toaster } from '@/components/ui/sonner'
import 'vue-sonner/style.css'

useHead({
  link: [
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap',
    },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,600;1,400&display=swap',
    },
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'apple-touch-icon', href: '/logo.svg' },
  ],
  script: [
    {
      // Applies the saved theme before first paint so switching MiniMax <-> IBM Carbon doesn't flash.
      innerHTML: `(function(){try{var t=localStorage.getItem('sso-admin-theme');if(t==='ibm'){document.documentElement.setAttribute('data-theme','ibm')}}catch(e){}})();`,
      tagPosition: 'head',
    },
  ],
})
</script>
