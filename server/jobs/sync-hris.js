import { db, users } from "../db/index.js";
import { eq } from "drizzle-orm";
import { logger } from "../services/logger.js";
import { writeAuditLog, AuditEvents } from "../services/audit.js";
import * as argon2 from "argon2";
async function fetchFromHris() {
  const baseUrl = process.env.HRIS_API_BASE_URL;
  const token = process.env.HRIS_API_TOKEN;
  if (!baseUrl || !token) {
    throw new Error("HRIS API configuration missing (HRIS_API_BASE_URL, HRIS_API_TOKEN)");
  }
  logger.info({ baseUrl }, "Fetching employees from HRIS API");
  try {
    const response = await fetch(`${baseUrl}/api/sync/users`, {
      headers: {
        "X-API-Key": token,
        "Accept": "application/json"
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HRIS API responded with status ${response.status}: ${errorText}`);
    }
    const result = await response.json();
    if (!result.success || !result.data) {
      throw new Error(`HRIS API returned unexpected format: ${JSON.stringify(result)}`);
    }
    logger.info({ count: result.data.length }, "Successfully fetched employees from HRIS");
    return result.data;
  } catch (error) {
    logger.error({ error, baseUrl }, "Failed to fetch from HRIS API");
    throw error;
  }
}
async function syncHrisUsers(requestId) {
  const startTime = Date.now();
  const result = {
    success: false,
    inserted: 0,
    updated: 0,
    disabled: 0,
    errors: [],
    duration_ms: 0
  };
  try {
    await writeAuditLog({
      action: AuditEvents.HRIS_SYNC_STARTED,
      actorType: "system",
      requestId
    });
    const employees = await fetchFromHris();
    logger.info({ count: employees.length }, "Fetched employees from HRIS");
    for (const emp of employees) {
      try {
        if (!emp.employee_id || !emp.email) {
          result.errors.push(`Invalid employee data: missing employee_id or email`);
          continue;
        }
        const [existing] = await db.select().from(users).where(eq(users.employeeId, emp.employee_id)).limit(1);
        const ssoStatus = emp.status === 1 ? "active" : "disabled";
        if (existing) {
          const needsUpdate = existing.email !== emp.email.toLowerCase() || existing.name !== emp.name || existing.status !== ssoStatus || existing.department !== emp.department || existing.position !== emp.position || existing.avatarUrl !== emp.images_url?.file || existing.roleId !== emp.role_id?.toString() || existing.roleName !== emp.roles;
          if (needsUpdate) {
            await db.update(users).set({
              email: emp.email.toLowerCase(),
              name: emp.name,
              status: ssoStatus,
              department: emp.department || null,
              position: emp.position || null,
              avatarUrl: emp.images_url?.file || null,
              roleId: emp.role_id?.toString() || null,
              roleName: emp.roles || null,
              updatedAt: /* @__PURE__ */ new Date()
            }).where(eq(users.id, existing.id));
            if (existing.status === "active" && ssoStatus === "disabled") {
              result.disabled++;
            } else {
              result.updated++;
            }
          }
        } else {
          const defaultPassword = process.env.HRIS_DEFAULT_PASSWORD || "Welcome123!";
          const passwordHash = await argon2.hash(defaultPassword);
          await db.insert(users).values({
            employeeId: emp.employee_id,
            email: emp.email.toLowerCase(),
            name: emp.name,
            status: ssoStatus,
            department: emp.department || null,
            position: emp.position || null,
            avatarUrl: emp.images_url?.file || null,
            roleId: emp.role_id?.toString() || null,
            roleName: emp.roles || null,
            passwordHash
            // Default password for development
          });
          result.inserted++;
        }
      } catch (error) {
        result.errors.push(`Error processing employee ${emp.employee_id}: ${error.message}`);
        logger.error({ error, employeeId: emp.employee_id }, "Error syncing employee");
      }
    }
    result.success = true;
    result.duration_ms = Date.now() - startTime;
    await writeAuditLog({
      action: AuditEvents.HRIS_SYNC_COMPLETED,
      actorType: "system",
      requestId,
      metadata: {
        inserted: result.inserted,
        updated: result.updated,
        disabled: result.disabled,
        errors: result.errors.length,
        duration_ms: result.duration_ms
      }
    });
    logger.info({
      inserted: result.inserted,
      updated: result.updated,
      disabled: result.disabled,
      errors: result.errors.length,
      duration_ms: result.duration_ms
    }, "HRIS sync completed");
    return result;
  } catch (error) {
    result.duration_ms = Date.now() - startTime;
    result.errors.push(error.message);
    await writeAuditLog({
      action: AuditEvents.HRIS_SYNC_FAILED,
      actorType: "system",
      requestId,
      metadata: {
        error: error.message,
        duration_ms: result.duration_ms
      }
    });
    logger.error({ error, duration_ms: result.duration_ms }, "HRIS sync failed");
    return result;
  }
}
export {
  syncHrisUsers
};
