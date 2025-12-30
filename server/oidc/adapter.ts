import { db, oidcKv } from '../db/index.ts'
import { and, eq, lt, isNotNull } from 'drizzle-orm'
import { logger } from '../services/logger.ts'

/**
 * PostgreSQL Adapter for oidc-provider
 * Uses a generic key-value store pattern for all OIDC artifacts
 */
export class PostgresAdapter {
  private model: string

  constructor(model: string) {
    this.model = model
  }

  /**
   * Find an item by its key (usually the token/code/id)
   */
  async find(id: string): Promise<Record<string, unknown> | undefined> {
    try {
      const result = await db
        .select()
        .from(oidcKv)
        .where(and(
          eq(oidcKv.model, this.model),
          eq(oidcKv.key, id)
        ))
        .limit(1)

      if (result.length === 0) {
        return undefined
      }

      const entry = result[0]

      // Check if expired
      if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
        return undefined
      }

      return entry.payload as Record<string, unknown>
    } catch (error) {
      logger.error({ error, model: this.model, id }, 'OIDC adapter find error')
      throw error
    }
  }

  /**
   * Find by user code (for device flow)
   */
  async findByUserCode(userCode: string): Promise<Record<string, unknown> | undefined> {
    try {
      const result = await db
        .select()
        .from(oidcKv)
        .where(and(
          eq(oidcKv.model, this.model),
          eq(oidcKv.userCode, userCode)
        ))
        .limit(1)

      if (result.length === 0) {
        return undefined
      }

      const entry = result[0]

      if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
        return undefined
      }

      return entry.payload as Record<string, unknown>
    } catch (error) {
      logger.error({ error, model: this.model, userCode }, 'OIDC adapter findByUserCode error')
      throw error
    }
  }

  /**
   * Find by uid (for grants)
   */
  async findByUid(uid: string): Promise<Record<string, unknown> | undefined> {
    try {
      const result = await db
        .select()
        .from(oidcKv)
        .where(and(
          eq(oidcKv.model, this.model),
          eq(oidcKv.uid, uid)
        ))
        .limit(1)

      if (result.length === 0) {
        return undefined
      }

      const entry = result[0]

      if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
        return undefined
      }

      return entry.payload as Record<string, unknown>
    } catch (error) {
      logger.error({ error, model: this.model, uid }, 'OIDC adapter findByUid error')
      throw error
    }
  }

  /**
   * Store a new item
   */
  async upsert(id: string, payload: Record<string, unknown>, expiresIn?: number): Promise<void> {
    try {
      const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null
      
      // Extract special fields from payload
      const userCode = payload.userCode as string | undefined
      const uid = payload.uid as string | undefined
      const grantId = payload.grantId as string | undefined

      // Try to update first
      const updateResult = await db
        .update(oidcKv)
        .set({
          payload,
          expiresAt,
          userCode,
          uid,
          grantId
        })
        .where(and(
          eq(oidcKv.model, this.model),
          eq(oidcKv.key, id)
        ))

      // If no rows updated, insert
      if (updateResult.count === 0) {
        await db.insert(oidcKv).values({
          model: this.model,
          key: id,
          payload,
          expiresAt,
          userCode,
          uid,
          grantId
        })
      }
    } catch (error) {
      logger.error({ error, model: this.model, id }, 'OIDC adapter upsert error')
      throw error
    }
  }

  /**
   * Consume a one-time use token (mark as consumed)
   */
  async consume(id: string): Promise<void> {
    try {
      const result = await db
        .select()
        .from(oidcKv)
        .where(and(
          eq(oidcKv.model, this.model),
          eq(oidcKv.key, id)
        ))
        .limit(1)

      if (result.length > 0) {
        const entry = result[0]
        const payload = entry.payload as Record<string, unknown>
        payload.consumed = Math.floor(Date.now() / 1000)

        await db
          .update(oidcKv)
          .set({ payload })
          .where(and(
            eq(oidcKv.model, this.model),
            eq(oidcKv.key, id)
          ))
      }
    } catch (error) {
      logger.error({ error, model: this.model, id }, 'OIDC adapter consume error')
      throw error
    }
  }

  /**
   * Delete an item
   */
  async destroy(id: string): Promise<void> {
    try {
      await db
        .delete(oidcKv)
        .where(and(
          eq(oidcKv.model, this.model),
          eq(oidcKv.key, id)
        ))
    } catch (error) {
      logger.error({ error, model: this.model, id }, 'OIDC adapter destroy error')
      throw error
    }
  }

  /**
   * Revoke all tokens associated with a grant
   */
  async revokeByGrantId(grantId: string): Promise<void> {
    try {
      await db
        .delete(oidcKv)
        .where(eq(oidcKv.grantId, grantId))
    } catch (error) {
      logger.error({ error, model: this.model, grantId }, 'OIDC adapter revokeByGrantId error')
      throw error
    }
  }

  /**
   * Clean up expired entries (run periodically)
   */
  static async cleanupExpired(): Promise<number> {
    try {
      const result = await db
        .delete(oidcKv)
        .where(and(
          isNotNull(oidcKv.expiresAt),
          lt(oidcKv.expiresAt, new Date())
        ))

      const deletedCount = result.count || 0
      if (deletedCount > 0) {
        logger.info({ deletedCount }, 'Cleaned up expired OIDC entries')
      }
      return deletedCount
    } catch (error) {
      logger.error({ error }, 'OIDC adapter cleanup error')
      throw error
    }
  }
}

// Factory function for oidc-provider
export function createAdapter(model: string): PostgresAdapter {
  return new PostgresAdapter(model)
}
