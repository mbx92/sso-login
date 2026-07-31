# Integrasi cepat — `@mbx92/nuxt-sso-client`

Package Nuxt untuk menghubungkan app ke IdP ini (Authorization Code + PKCE).

Lokasi sumber: [`packages/nuxt-sso-client`](../packages/nuxt-sso-client)  
Registry: **GitHub Packages** (repo [mbx92/sso-login](https://github.com/mbx92/sso-login))

## Install

```ini
# .npmrc (di project konsumen)
@mbx92:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

```bash
pnpm add @mbx92/nuxt-sso-client
```

Lokal tanpa registry:

```bash
pnpm add @mbx92/nuxt-sso-client@file:../sso-login/packages/nuxt-sso-client
```

## Setup

```js
// nuxt.config
modules: ['@mbx92/nuxt-sso-client']
```

```js
// server/sso/resolve-user.js  ← map email SSO → session lokal
export default async function resolveSsoUser(event, { userInfo, sso }) {
  // find/create user + setUserSession(...)
  return { redirectTo: '/' }
}
```

```vue
const { enabled, loginWithSso } = useSso()
```

Env: `SSO_ISSUER`, `SSO_CLIENT_ID`, `SSO_CLIENT_SECRET`, `SSO_REDIRECT_URI`, `APP_URL`

1. Daftarkan OIDC client di Admin SSO  
2. Buat `server/sso/resolve-user.js`  
3. Tombol: `useSso()`

Contoh hidup: project **MailOG**.
