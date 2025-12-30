import { defineEventHandler, readBody, getQuery, getHeader, createError, sendRedirect } from 'h3'
import { getOidcProvider } from '../../oidc/provider.ts'
import { authenticateUser } from '../../oidc/interactions.ts'

/**
 * Handle OIDC interaction - login form submission
 */
export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({
      statusCode: 405,
      message: 'Method not allowed'
    })
  }

  const body = await readBody(event)
  const { uid, identifier, password, consent } = body

  if (!uid) {
    throw createError({
      statusCode: 400,
      message: 'Missing interaction uid'
    })
  }

  const provider = getOidcProvider()

  try {
    // Get interaction details
    const interactionDetails = await provider.interactionDetails(event.node.req, event.node.res)
    const { prompt, params, session } = interactionDetails

    if (prompt.name === 'login') {
      // Handle login
      if (!identifier || !password) {
        // Return to login page with error
        return sendRedirect(event, `/login?interaction=${uid}&error=missing_credentials`)
      }

      const result = await authenticateUser(identifier, password, {
        ip: getHeader(event, 'x-forwarded-for') || event.node.req.socket.remoteAddress,
        userAgent: getHeader(event, 'user-agent'),
        requestId: event.context.requestId
      })

      if (!result.success) {
        return sendRedirect(event, `/login?interaction=${uid}&error=${encodeURIComponent(result.error || 'login_failed')}`)
      }

      // Complete login interaction
      const interactionResult = {
        login: {
          accountId: result.userId!
        }
      }

      await provider.interactionFinished(event.node.req, event.node.res, interactionResult, {
        mergeWithLastSubmission: false
      })

      return

    } else if (prompt.name === 'consent') {
      // Handle consent
      if (consent !== 'granted') {
        // Consent denied
        const interactionResult = {
          error: 'access_denied',
          error_description: 'User denied consent'
        }
        await provider.interactionFinished(event.node.req, event.node.res, interactionResult, {
          mergeWithLastSubmission: false
        })
        return
      }

      // Get the grant
      let grant
      if (interactionDetails.grantId) {
        grant = await provider.Grant.find(interactionDetails.grantId)
      } else {
        grant = new provider.Grant({
          accountId: session?.accountId,
          clientId: params.client_id as string
        })
      }

      if (grant) {
        // Add requested scopes
        const requestedScopes = (params.scope as string)?.split(' ') || []
        for (const scope of requestedScopes) {
          grant.addOIDCScope(scope)
        }

        // Save grant
        const grantId = await grant.save()

        // Complete consent interaction
        const interactionResult = {
          consent: {
            grantId
          }
        }

        await provider.interactionFinished(event.node.req, event.node.res, interactionResult, {
          mergeWithLastSubmission: true
        })
      }

      return

    } else {
      throw createError({
        statusCode: 400,
        message: `Unknown interaction prompt: ${prompt.name}`
      })
    }
  } catch (error: any) {
    event.context.logger?.error({ error }, 'Interaction error')
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: 'Interaction failed'
    })
  }
})
