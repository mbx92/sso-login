# `@mbx92/nuxt-sso-client`

Modul Nuxt untuk menghubungkan app ke **SSO Identity Provider** (`mbx92/sso-login`) — OIDC Authorization Code + PKCE.

Published via **GitHub Packages** dari repo [mbx92/sso-login](https://github.com/mbx92/sso-login).

## Install (GitHub Packages)

Di project konsumen, buat/isi `.npmrc`:

```ini
@mbx92:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Token GitHub perlu scope: `read:packages` (install) / `write:packages` (publish).  
Untuk private package, akun harus punya akses ke repo `mbx92/sso-login`.

```bash
pnpm add @mbx92/nuxt-sso-client
# atau
npm install @mbx92/nuxt-sso-client
```

### Install lokal (dev tanpa registry)

```bash
pnpm add @mbx92/nuxt-sso-client@file:../sso-login/packages/nuxt-sso-client
```

## Setup (3 langkah)

### 1. Modul + env

```js
// nuxt.config.js
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
})
```

```env
SSO_ISSUER=http://localhost:3010
SSO_CLIENT_ID=sso_xxxx
SSO_CLIENT_SECRET=xxxx
SSO_REDIRECT_URI=http://localhost:3000/api/auth/sso/callback
APP_URL=http://localhost:3000
SSO_AUTO_PROVISION=true
```

Daftarkan client di SSO Admin → OIDC Clients dengan redirect URI yang sama.

### 2. Resolver user lokal (wajib)

Buat `server/sso/resolve-user.js`:

```js
export default async function resolveSsoUser(event, { userInfo, tokens, sso }) {
  // cari / buat user lokal by userInfo.email
  // await setUserSession(event, { user: { id, email, name } })
  return { redirectTo: '/' }
}
```

### 3. Tombol login

```vue
<script setup>
const { enabled, loginWithSso } = useSso()
</script>

<template>
  <button v-if="enabled" type="button" @click="loginWithSso">
    Masuk dengan SSO
  </button>
</template>
```

## Routes

| Method | Path | Fungsi |
|--------|------|--------|
| GET | `/api/auth/sso/login` | Mulai PKCE → redirect ke SSO |
| GET | `/api/auth/sso/callback` | Tukar code → userinfo → resolve-user |
| GET | `/api/auth/sso/check-session` | Cek ke issuer apakah sesi SSO masih aktif (mis. belum di-revoke admin) |

## Cek revoke sesi

Paket menyimpan account id SSO (`userInfo.sub`) di cookie sesi miliknya sendiri
(terpisah dari sesi aplikasi host) saat callback berhasil. Panggil dari
middleware/plugin client secara berkala:

```js
const { checkSession, redirectToLogin } = useSso()

const valid = await checkSession()
if (!valid) redirectToLogin('session_expired')
```

Tidak perlu menyimpan token apa pun di sisi host — paket menanganinya sendiri.

## Publish (maintainer)

Dari folder package, setelah login GitHub Packages:

```bash
cd packages/nuxt-sso-client
# TOKEN dengan write:packages
echo "//npm.pkg.github.com/:_authToken=ghp_xxx" >> ~/.npmrc
echo "@mbx92:registry=https://npm.pkg.github.com" >> ~/.npmrc
npm publish
```

Atau push tag / jalankan workflow `.github/workflows/publish-nuxt-sso-client.yml`.
