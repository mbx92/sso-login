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
    port: 3000,
  },

  modules: ['@nuxt/ui', '@pinia/nuxt', '@vueuse/nuxt'],

  vite: {
    plugins: [tailwindcss()],
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    public: {
      baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    },
  },

  nitro: {
    experimental: {
      asyncContext: true,
    },
  },

  typescript: {
    strict: false,
    typeCheck: false,
    shim: false,
  },
})