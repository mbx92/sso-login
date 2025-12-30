import { defineEventHandler } from 'h3'
import { getOidcProvider } from '../../oidc/provider.ts'

/**
 * OpenID Connect Discovery endpoint
 * Returns the provider's configuration
 */
export default defineEventHandler(async (event) => {
  const provider = getOidcProvider()
  const callback = provider.callback()

  const req = event.node.req
  const res = event.node.res

  return new Promise((resolve, reject) => {
    callback(req, res)
      .then(() => resolve(undefined))
      .catch(reject)
  })
})
