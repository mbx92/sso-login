import { defineNuxtModule, addServerHandler, addImportsDir, createResolver, addTemplate } from '@nuxt/kit'
import { existsSync } from 'node:fs'
import { resolve as pathResolve } from 'node:path'

export default defineNuxtModule({
  meta: {
    name: '@mbx92/nuxt-sso-client',
    configKey: 'ssoClient',
    compatibility: { nuxt: '>=3.0.0' },
  },
  defaults: {
    /** Path ke resolver user lokal (relatif ke project root). */
    resolveUser: 'server/sso/resolve-user.js',
    /** Prefix route API SSO */
    apiBase: '/api/auth/sso',
    /** Cookie name untuk PKCE state */
    pkceCookie: 'mbx_sso_pkce',
    /** Default success redirect */
    successRedirect: '/',
    /** Default login/error redirect */
    loginPath: '/login',
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    const rootDir = nuxt.options.rootDir

    const resolveUserAbs = pathResolve(rootDir, options.resolveUser)
    if (!existsSync(resolveUserAbs)) {
      console.warn(
        `[@mbx92/nuxt-sso-client] Missing ${options.resolveUser} — create it to map SSO userinfo → local session.`,
      )
    }

    nuxt.options.build.transpile = nuxt.options.build.transpile || []
    nuxt.options.build.transpile.push('@mbx92/nuxt-sso-client')

    // Runtime config (env: SSO_*)
    nuxt.options.runtimeConfig.sso = {
      issuer: process.env.SSO_ISSUER || '',
      clientId: process.env.SSO_CLIENT_ID || '',
      clientSecret: process.env.SSO_CLIENT_SECRET || '',
      redirectUri: process.env.SSO_REDIRECT_URI || '',
      autoProvision: process.env.SSO_AUTO_PROVISION !== 'false',
      pkceCookie: options.pkceCookie,
      successRedirect: options.successRedirect,
      loginPath: options.loginPath,
      ...(nuxt.options.runtimeConfig.sso || {}),
    }

    nuxt.options.runtimeConfig.public = nuxt.options.runtimeConfig.public || {}
    nuxt.options.runtimeConfig.public.appUrl =
      nuxt.options.runtimeConfig.public.appUrl || process.env.APP_URL || ''
    nuxt.options.runtimeConfig.public.ssoEnabled = !!(
      (nuxt.options.runtimeConfig.sso?.issuer || process.env.SSO_ISSUER) &&
      (nuxt.options.runtimeConfig.sso?.clientId || process.env.SSO_CLIENT_ID)
    )
    nuxt.options.runtimeConfig.public.ssoLoginPath = `${options.apiBase}/login`

    // Virtual import for host resolver
    const resolverImportPath = resolveUserAbs.replace(/\\/g, '/')
    addTemplate({
      filename: 'mbx-sso-user-resolver.mjs',
      getContents: () =>
        existsSync(resolveUserAbs)
          ? `export { default } from '${resolverImportPath}'\n`
          : `export default async function missingResolver() {
  throw createError({
    statusCode: 500,
    statusMessage: 'SSO resolve-user missing. Create ${options.resolveUser}',
  })
}
`,
      write: true,
    })

    nuxt.hook('nitro:config', (nitroConfig) => {
      nitroConfig.alias = nitroConfig.alias || {}
      nitroConfig.alias['#mbx-sso-resolve-user'] = pathResolve(
        nuxt.options.buildDir,
        'mbx-sso-user-resolver.mjs',
      ).replace(/\\/g, '/')

      nitroConfig.virtual = nitroConfig.virtual || {}
    })

    addImportsDir(resolve('./runtime/composables'))

    addServerHandler({
      route: `${options.apiBase}/login`,
      handler: resolve('./runtime/server/routes/login.get.js'),
    })
    addServerHandler({
      route: `${options.apiBase}/callback`,
      handler: resolve('./runtime/server/routes/callback.get.js'),
    })
  },
})
