import { defineEventHandler, getQuery, createError } from 'h3'
import { getOidcProvider } from '../../oidc/provider.ts'

/**
 * Get interaction details for rendering login/consent page
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const uid = query.uid as string

  if (!uid) {
    throw createError({
      statusCode: 400,
      message: 'Missing interaction uid'
    })
  }

  const provider = getOidcProvider()

  try {
    const interactionDetails = await provider.interactionDetails(event.node.req, event.node.res)
    
    const { prompt, params, session } = interactionDetails

    // Get client info if available
    let clientInfo = null
    if (params.client_id) {
      const client = await provider.Client.find(params.client_id as string)
      if (client) {
        clientInfo = {
          clientId: client.clientId,
          clientName: client.clientName || client.clientId,
          logoUri: client.logoUri,
          policyUri: client.policyUri,
          tosUri: client.tosUri
        }
      }
    }

    return {
      uid: interactionDetails.uid,
      prompt: prompt.name,
      promptDetails: prompt.details,
      params: {
        clientId: params.client_id,
        redirectUri: params.redirect_uri,
        scope: params.scope,
        responseType: params.response_type,
        state: params.state
      },
      client: clientInfo,
      session: session ? {
        accountId: session.accountId
      } : null
    }
  } catch (error: any) {
    event.context.logger?.error({ error, uid }, 'Failed to get interaction details')
    
    throw createError({
      statusCode: 400,
      message: 'Invalid or expired interaction'
    })
  }
})
