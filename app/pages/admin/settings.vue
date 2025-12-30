<template>
  <NuxtLayout name="admin">
    <div>
      <h1 class="text-2xl font-bold mb-6">Settings</h1>

      <!-- Issuer Info -->
      <div class="card bg-base-100 shadow mb-6">
        <div class="card-body">
          <h2 class="card-title">OIDC Configuration</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label class="text-sm font-medium text-base-content/60">Issuer URL</label>
              <div class="bg-base-200 p-3 rounded mt-1">
                <code>{{ issuer }}</code>
              </div>
            </div>
            <div>
              <label class="text-sm font-medium text-base-content/60">Discovery Endpoint</label>
              <div class="bg-base-200 p-3 rounded mt-1">
                <code>{{ issuer }}/.well-known/openid-configuration</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Endpoints -->
      <div class="card bg-base-100 shadow mb-6">
        <div class="card-body">
          <h2 class="card-title">OIDC Endpoints</h2>
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>Endpoint</th>
                  <th>URL</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="endpoint in endpoints" :key="endpoint.name">
                  <td class="font-medium">{{ endpoint.name }}</td>
                  <td><code class="text-sm">{{ endpoint.url }}</code></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Key Management -->
      <div class="card bg-base-100 shadow mb-6">
        <div class="card-body">
          <h2 class="card-title">Key Management</h2>
          <div class="alert alert-info mt-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p class="font-medium">JWT Signing Keys</p>
              <p class="text-sm">Keys are automatically generated on first server start. For production, consider setting up key rotation.</p>
            </div>
          </div>
          <div class="mt-4">
            <a :href="`${issuer}/.well-known/jwks.json`" target="_blank" class="btn btn-outline btn-sm">
              View JWKS
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <!-- Environment Info -->
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <h2 class="card-title">Environment</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label class="text-sm font-medium text-base-content/60">Node Environment</label>
              <div class="bg-base-200 p-3 rounded mt-1">
                <span class="badge" :class="isProd ? 'badge-error' : 'badge-success'">
                  {{ isProd ? 'production' : 'development' }}
                </span>
              </div>
            </div>
            <div>
              <label class="text-sm font-medium text-base-content/60">Log Level</label>
              <div class="bg-base-200 p-3 rounded mt-1">
                <code>{{ logLevel }}</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const config = useRuntimeConfig()
const issuer = config.public.ssoIssuer
const isProd = process.env.NODE_ENV === 'production'
const logLevel = 'info' // Would come from runtime config

const endpoints = [
  { name: 'Authorization', url: `${issuer}/oidc/auth` },
  { name: 'Token', url: `${issuer}/oidc/token` },
  { name: 'UserInfo', url: `${issuer}/oidc/userinfo` },
  { name: 'JWKS', url: `${issuer}/oidc/jwks` },
  { name: 'End Session', url: `${issuer}/oidc/session/end` },
  { name: 'Introspection', url: `${issuer}/oidc/token/introspection` },
  { name: 'Revocation', url: `${issuer}/oidc/token/revocation` }
]
</script>
