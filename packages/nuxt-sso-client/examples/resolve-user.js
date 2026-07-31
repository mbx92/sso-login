/**
 * Salin file ini ke app host sebagai: server/sso/resolve-user.js
 *
 * @param {import('h3').H3Event} event
 * @param {{ userInfo: Record<string, any>, tokens: Record<string, any>, sso: Record<string, any> }} ctx
 */
export default async function resolveSsoUser(event, { userInfo, sso }) {
  const email = String(userInfo.email || '').toLowerCase().trim()

  // TODO: cari user lokal by email
  // const user = await findUserByEmail(email)
  // if (!user && sso.autoProvision) { ... create ... }
  // if (!user) throw createError({ statusCode: 403, statusMessage: 'User belum terdaftar' })

  // TODO: set session app Anda.
  // Jika pakai nuxt-auth-utils, pastikan cookie name = "nuxt-session"
  // (jangan raw useSession tanpa name — default cookie "h3" tidak terbaca middleware).
  // await setUserSession(event, {
  //   user: { id: user.id, email: user.email, name: userInfo.name },
  // })

  return { redirectTo: '/' }
}
