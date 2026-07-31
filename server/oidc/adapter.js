import { db, oidcKv } from "../db/index.js";
import { and, eq, lt, isNotNull } from "drizzle-orm";
import { logger } from "../services/logger.js";
class PostgresAdapter {
  model;
  constructor(model) {
    this.model = model;
  }
  /**
   * Find an item by its key (usually the token/code/id)
   */
  async find(id) {
    try {
      const result = await db.select().from(oidcKv).where(and(
        eq(oidcKv.model, this.model),
        eq(oidcKv.key, id)
      )).limit(1);
      if (result.length === 0) {
        return void 0;
      }
      const entry = result[0];
      if (entry.expiresAt && new Date(entry.expiresAt) < /* @__PURE__ */ new Date()) {
        return void 0;
      }
      return entry.payload;
    } catch (error) {
      logger.error({ error, model: this.model, id }, "OIDC adapter find error");
      throw error;
    }
  }
  /**
   * Find by user code (for device flow)
   */
  async findByUserCode(userCode) {
    try {
      const result = await db.select().from(oidcKv).where(and(
        eq(oidcKv.model, this.model),
        eq(oidcKv.userCode, userCode)
      )).limit(1);
      if (result.length === 0) {
        return void 0;
      }
      const entry = result[0];
      if (entry.expiresAt && new Date(entry.expiresAt) < /* @__PURE__ */ new Date()) {
        return void 0;
      }
      return entry.payload;
    } catch (error) {
      logger.error({ error, model: this.model, userCode }, "OIDC adapter findByUserCode error");
      throw error;
    }
  }
  /**
   * Find by uid (for grants)
   */
  async findByUid(uid) {
    try {
      const result = await db.select().from(oidcKv).where(and(
        eq(oidcKv.model, this.model),
        eq(oidcKv.uid, uid)
      )).limit(1);
      if (result.length === 0) {
        return void 0;
      }
      const entry = result[0];
      if (entry.expiresAt && new Date(entry.expiresAt) < /* @__PURE__ */ new Date()) {
        return void 0;
      }
      return entry.payload;
    } catch (error) {
      logger.error({ error, model: this.model, uid }, "OIDC adapter findByUid error");
      throw error;
    }
  }
  /**
   * Store a new item
   */
  async upsert(id, payload, expiresIn) {
    try {
      const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1e3) : null;
      const userCode = payload.userCode;
      const uid = payload.uid;
      const grantId = payload.grantId;
      const updateResult = await db.update(oidcKv).set({
        payload,
        expiresAt,
        userCode,
        uid,
        grantId
      }).where(and(
        eq(oidcKv.model, this.model),
        eq(oidcKv.key, id)
      ));
      if (updateResult.count === 0) {
        await db.insert(oidcKv).values({
          model: this.model,
          key: id,
          payload,
          expiresAt,
          userCode,
          uid,
          grantId
        });
      }
    } catch (error) {
      logger.error({ error, model: this.model, id }, "OIDC adapter upsert error");
      throw error;
    }
  }
  /**
   * Consume a one-time use token (mark as consumed)
   */
  async consume(id) {
    try {
      const result = await db.select().from(oidcKv).where(and(
        eq(oidcKv.model, this.model),
        eq(oidcKv.key, id)
      )).limit(1);
      if (result.length > 0) {
        const entry = result[0];
        const payload = entry.payload;
        payload.consumed = Math.floor(Date.now() / 1e3);
        await db.update(oidcKv).set({ payload }).where(and(
          eq(oidcKv.model, this.model),
          eq(oidcKv.key, id)
        ));
      }
    } catch (error) {
      logger.error({ error, model: this.model, id }, "OIDC adapter consume error");
      throw error;
    }
  }
  /**
   * Delete an item
   */
  async destroy(id) {
    try {
      await db.delete(oidcKv).where(and(
        eq(oidcKv.model, this.model),
        eq(oidcKv.key, id)
      ));
    } catch (error) {
      logger.error({ error, model: this.model, id }, "OIDC adapter destroy error");
      throw error;
    }
  }
  /**
   * Revoke all tokens associated with a grant
   */
  async revokeByGrantId(grantId) {
    try {
      await db.delete(oidcKv).where(eq(oidcKv.grantId, grantId));
    } catch (error) {
      logger.error({ error, model: this.model, grantId }, "OIDC adapter revokeByGrantId error");
      throw error;
    }
  }
  /**
   * Clean up expired entries (run periodically)
   */
  static async cleanupExpired() {
    try {
      const result = await db.delete(oidcKv).where(and(
        isNotNull(oidcKv.expiresAt),
        lt(oidcKv.expiresAt, /* @__PURE__ */ new Date())
      ));
      const deletedCount = result.count || 0;
      if (deletedCount > 0) {
        logger.info({ deletedCount }, "Cleaned up expired OIDC entries");
      }
      return deletedCount;
    } catch (error) {
      logger.error({ error }, "OIDC adapter cleanup error");
      throw error;
    }
  }
}
function createAdapter(model) {
  return new PostgresAdapter(model);
}
export {
  PostgresAdapter,
  createAdapter
};
