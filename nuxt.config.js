// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  srcDir: 'app/',

  dir: {
    pages: 'pages',
    layouts: 'layouts',
    middleware: 'middleware',
  },

  devServer: {
    port: 3010,
  },

  modules: ['shadcn-nuxt', '@pinia/nuxt', '@vueuse/nuxt'],

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },

  vite: {
    plugins: [tailwindcss()],
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'SSO Login',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/logo.svg' },
      ],
    },
  },

  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    public: {
      baseUrl: process.env.BASE_URL || 'http://10.5.80.141:3010',
    },
  },

  nitro: {
    experimental: {
      asyncContext: true,
    },
  },
})
