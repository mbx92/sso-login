<template>
  <NuxtLayout name="admin">
    <div class="space-y-6">
      <!-- Page Header -->
      <div>
        <h1 class="text-2xl font-semibold text-ink">Panduan Integrasi SSO Client</h1>
        <p class="text-sm text-steel mt-1">
          Cara menghubungkan aplikasi internal ke SSO ini pakai <code class="text-xs bg-surface px-1.5 py-0.5 rounded">@mbx92/nuxt-sso-client</code>
        </p>
      </div>

      <!-- Inhouse notice -->
      <div class="bg-canvas rounded-xl border border-hairline p-5 flex gap-3">
        <div class="shrink-0 w-9 h-9 rounded-lg bg-success-bg flex items-center justify-center">
          <ShieldCheck class="w-5 h-5 text-success-text" />
        </div>
        <div class="text-sm text-charcoal">
          <p class="font-medium text-ink mb-1">Khusus sistem inhouse</p>
          <p>
            Karena semua konsumen package ini adalah aplikasi buatan sendiri, install-nya cukup pakai
            <code class="text-xs bg-surface px-1 py-0.5 rounded">file:</code> dependency ke folder
            <code class="text-xs bg-surface px-1 py-0.5 rounded">packages/nuxt-sso-client</code> — tidak perlu setup token GitHub
            Packages. Panduan GitHub Packages tetap ada di
            <code class="text-xs bg-surface px-1 py-0.5 rounded">packages/nuxt-sso-client/README.md</code> kalau suatu saat dibutuhkan.
          </p>
        </div>
      </div>

      <!-- Steps -->
      <div v-for="step in steps" :key="step.n" class="bg-canvas rounded-xl border border-hairline p-6 space-y-3">
        <div class="flex items-center gap-3">
          <span class="shrink-0 w-7 h-7 rounded-full bg-surface text-ink text-sm font-semibold flex items-center justify-center">
            {{ step.n }}
          </span>
          <h2 class="text-base font-semibold text-ink">{{ step.title }}</h2>
        </div>
        <p v-if="step.desc" class="text-sm text-steel" v-html="step.desc" />
        <pre v-if="step.code" class="bg-ink text-white text-xs leading-relaxed rounded-lg p-4 overflow-x-auto font-mono"><code>{{ step.code }}</code></pre>
        <p v-if="step.note" class="text-xs text-steel">{{ step.note }}</p>
      </div>

      <!-- Routes reference -->
      <div class="bg-canvas rounded-xl border border-hairline shadow-none overflow-hidden">
        <div class="px-6 py-4 border-b border-hairline">
          <h3 class="text-base font-semibold text-ink">Routes yang disediakan module</h3>
          <p class="text-xs text-steel mt-1">Prefix default: <code class="bg-surface px-1 py-0.5 rounded">/api/auth/sso</code> (bisa diubah via opsi <code class="bg-surface px-1 py-0.5 rounded">apiBase</code>)</p>
        </div>
        <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-surface">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-steel uppercase tracking-wider">Method</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-steel uppercase tracking-wider">Path</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-steel uppercase tracking-wider">Fungsi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-hairline-soft">
            <tr v-for="r in routes" :key="r.path">
              <td class="px-6 py-3">
                <span class="inline-flex px-2 py-0.5 rounded text-xs font-mono font-medium bg-surface text-charcoal">{{ r.method }}</span>
              </td>
              <td class="px-6 py-3 text-sm font-mono text-ink">{{ r.path }}</td>
              <td class="px-6 py-3 text-sm text-steel">{{ r.desc }}</td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>

      <!-- Env vars reference -->
      <div class="bg-canvas rounded-xl border border-hairline shadow-none overflow-hidden">
        <div class="px-6 py-4 border-b border-hairline">
          <h3 class="text-base font-semibold text-ink">Environment variables (app konsumen)</h3>
        </div>
        <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-surface">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-steel uppercase tracking-wider">Variable</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-steel uppercase tracking-wider">Keterangan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-hairline-soft">
            <tr v-for="e in envVars" :key="e.name">
              <td class="px-6 py-3 text-sm font-mono text-ink whitespace-nowrap">{{ e.name }}</td>
              <td class="px-6 py-3 text-sm text-steel">{{ e.desc }}</td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>

      <!-- Troubleshooting -->
      <div class="bg-canvas rounded-xl border border-hairline p-6">
        <h3 class="text-base font-semibold text-ink mb-4">Troubleshooting</h3>
        <div class="space-y-4">
          <div v-for="t in troubleshooting" :key="t.problem" class="flex gap-3">
            <AlertTriangle class="w-4 h-4 text-steel shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-ink">{{ t.problem }}</p>
              <p class="text-sm text-steel mt-0.5">{{ t.fix }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer links -->
      <div class="bg-canvas rounded-xl border border-hairline p-6 flex items-center justify-between flex-wrap gap-3">
        <p class="text-sm text-steel">
          Sumber package: <code class="bg-surface px-1.5 py-0.5 rounded text-xs">packages/nuxt-sso-client</code> ·
          Contoh integrasi nyata: project <strong class="text-ink">MailOG</strong>
        </p>
        <NuxtLink
          to="/admin/clients"
          class="inline-flex items-center gap-2 px-4 py-2 border border-hairline text-charcoal rounded-lg hover:bg-surface transition-colors text-sm"
        >
          <KeyRound class="w-4 h-4" />
          Kelola OIDC Clients
        </NuxtLink>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { ShieldCheck, AlertTriangle, KeyRound } from '@lucide/vue'

definePageMeta({
  middleware: ['auth'],
})

const steps = [
  {
    n: 1,
    title: 'Daftarkan OIDC Client',
    desc: 'Buka <a href="/admin/clients" class="text-ink underline">OIDC Clients</a> → buat client baru untuk app kamu. Catat <strong>Client ID</strong> dan <strong>Client Secret</strong>-nya, lalu set redirect URI persis seperti ini:',
    code: 'https://app-kamu.domain/api/auth/sso/callback',
    note: 'Ganti prefix /api/auth/sso kalau kamu override opsi apiBase di nuxt.config.',
  },
  {
    n: 2,
    title: 'Install package',
    code: `pnpm add @mbx92/nuxt-sso-client@file:../sso-login/packages/nuxt-sso-client

# setelah update kode package (mis. sso-login ditarik ulang / di-pull),
# wajib pnpm install lagi -- pnpm menyalin file, bukan symlink live ke source`,
  },
  {
    n: 3,
    title: 'Daftarkan module + konfigurasi',
    code: `// nuxt.config.js
export default defineNuxtConfig({
  modules: ['@mbx92/nuxt-sso-client'],

  ssoClient: {
    resolveUser: 'server/sso/resolve-user.js',
    successRedirect: '/',
    loginPath: '/login',
  },

  runtimeConfig: {
    public: {
      appUrl: process.env.APP_URL || 'http://localhost:3000',
    },
  },
})`,
  },
  {
    n: 4,
    title: 'Buat resolver user lokal (wajib)',
    desc: 'File ini yang memetakan identitas dari SSO ke session aplikasi kamu — buat / cari user lokal, lalu set session-nya sendiri.',
    code: `// server/sso/resolve-user.js
export default async function resolveSsoUser(event, { userInfo, tokens, sso }) {
  const email = String(userInfo.email || '').toLowerCase().trim()

  // TODO: cari / buat user lokal by email
  // if (!user && sso.autoProvision) { ... }
  // if (!user) throw createError({ statusCode: 403, statusMessage: 'User belum terdaftar' })

  // TODO: set session app kamu (h3 useSession / nuxt-auth-utils setUserSession)
  return { redirectTo: '/' }
}`,
    note: 'Kalau pakai nuxt-auth-utils, cookie session HARUS bernama "nuxt-session" -- default h3 tidak dikenali middleware-nya.',
  },
  {
    n: 5,
    title: 'Tombol login',
    code: `<script setup>
const { enabled, loginWithSso } = useSso()
<\/script>

<template>
  <button v-if="enabled" @click="loginWithSso">Masuk dengan SSO</button>
</template>`,
  },
  {
    n: 6,
    title: 'Deteksi sesi di-revoke (opsional tapi direkomendasikan)',
    desc: 'Poll berkala supaya user otomatis logout kalau sesinya dicabut dari Admin SSO. Traffic poll ini juga otomatis menghidupkan status "Online Now" di Active Sessions -- tidak perlu heartbeat terpisah.',
    code: `// app/middleware/auth.global.js
const { checkSession, redirectToLogin } = useSso()

// panggil tiap ~30 detik selagi user login lewat SSO
const valid = await checkSession()
if (!valid) redirectToLogin('session_expired')`,
  },
]

const routes = [
  { method: 'GET', path: '/api/auth/sso/login', desc: 'Mulai PKCE flow → redirect ke halaman login SSO' },
  { method: 'GET', path: '/api/auth/sso/callback', desc: 'Tukar authorization code → userinfo → panggil resolve-user' },
  { method: 'GET', path: '/api/auth/sso/check-session', desc: 'Cek ke issuer apakah sesi masih valid (belum di-revoke admin)' },
]

const envVars = [
  { name: 'SSO_ISSUER', desc: 'URL SSO ini, mis. https://sso.domain-internal' },
  { name: 'SSO_CLIENT_ID', desc: 'Client ID dari step 1' },
  { name: 'SSO_CLIENT_SECRET', desc: 'Client Secret dari step 1' },
  { name: 'SSO_REDIRECT_URI', desc: 'Harus sama persis dengan yang didaftarkan di step 1' },
  { name: 'SSO_AUTO_PROVISION', desc: '"true"/"false" -- auto-create user lokal saat login SSO pertama kali (default true)' },
  { name: 'APP_URL', desc: 'Base URL aplikasi kamu sendiri' },
]

const troubleshooting = [
  {
    problem: 'Redirect balik ke SSO gagal / "invalid redirect_uri"',
    fix: 'Redirect URI di .env (SSO_REDIRECT_URI) harus identik karakter-per-karakter dengan yang didaftarkan di OIDC Clients, termasuk trailing slash dan http/https.',
  },
  {
    problem: 'Warning "Missing server/sso/resolve-user.js" di console',
    fix: 'File resolver belum dibuat di app konsumen -- lihat step 4. Tanpa file ini, callback akan selalu gagal dengan error 500.',
  },
  {
    problem: 'Perubahan di packages/nuxt-sso-client tidak kebawa ke app konsumen',
    fix: 'pnpm dengan file: dependency menyalin package saat install, bukan symlink live. Jalankan pnpm install lagi di app konsumen setiap kali source package berubah.',
  },
  {
    problem: 'Login SSO sukses tapi session app konsumen tidak ke-set',
    fix: 'Cek resolve-user.js benar-benar men-set session (bukan cuma return { redirectTo }). Kalau pakai nuxt-auth-utils, nama cookie session harus "nuxt-session".',
  },
  {
    problem: '"Online Now" di Active Sessions tidak update walau user aktif di app lain',
    fix: 'Pastikan step 6 (checkSession polling) sudah dipasang -- itu satu-satunya sinyal aktivitas yang dikirim dari app konsumen ke SSO ini.',
  },
]
</script>
