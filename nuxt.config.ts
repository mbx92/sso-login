// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,

  modules: [
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui'
  ],

  // Runtime config for environment variables
  runtimeConfig: {
    // Private keys (server-only)
    databaseUrl: process.env.DATABASE_URL || 'postgres://localhost:5432/sso_db',
    sessionSecret: process.env.SESSION_SECRET || 'change-me-in-production',
    superadminEmail: process.env.SUPERADMIN_EMAIL || 'admin@example.com',
    superadminPassword: process.env.SUPERADMIN_PASSWORD || 'change-me',
    hrisApiBaseUrl: process.env.HRIS_API_BASE_URL || 'http://hris.local',
    hrisApiToken: process.env.HRIS_API_TOKEN || '',
    logLevel: process.env.LOG_LEVEL || 'info',
    // Public keys (exposed to client)
    public: {
      ssoIssuer: process.env.SSO_ISSUER || 'https://sso.placeholder.local',
      appName: 'SSO Identity Provider'
    }
  },

  // Nitro server configuration
  nitro: {
    experimental: {
      asyncContext: true
    }
  },

  // CSS configuration for DaisyUI
  css: ['~/assets/css/main.css']
})