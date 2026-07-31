import { defineEventHandler, createError, getHeader, getRequestIP } from "h3";
import { db, divisions, sites } from "../../../db";
import { createAuditLog } from "../../../services/audit";
import { z } from "zod";
import { getAuthUser } from "../../../utils/auth";
import { eq } from "drizzle-orm";
const createDivisionSchema = z.object({
  siteId: z.string().uuid("ID site tidak valid"),
  code: z.string().min(1, "Kode divisi wajib diisi").max(50),
  name: z.string().min(1, "Nama divisi wajib diisi").max(255),
  description: z.string().optional(),
  isActive: z.boolean().default(true)
});
async function parseBody(event) {
  return new Promise((resolve) => {
    const chunks = [];
    const req = event.node?.req;
    if (!req) {
      resolve({});
      return;
    }
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
        resolve(body);
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}
var index_post_default = defineEventHandler(async (event) => {
  const user = getAuthUser(event);
  const body = await parseBody(event);
  const validation = createDivisionSchema.safeParse(body);
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: validation.error.errors[0].message
    });
  }
  const { siteId, code, name, description, isActive } = validation.data;
  if (user?.roleId !== "superadmin" && user?.siteId && user.siteId !== siteId) {
    throw createError({
      statusCode: 403,
      message: "Anda tidak memiliki akses untuk membuat divisi di site ini"
    });
  }
  try {
    const site = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
    if (site.length === 0) {
      throw createError({
        statusCode: 400,
        message: "Site tidak ditemukan"
      });
    }
    const [newDivision] = await db.insert(divisions).values({
      siteId,
      code,
      name,
      description: description || null,
      isActive
    }).returning();
    await createAuditLog({
      userId: user?.userId || "system",
      action: "division.create",
      resource: "division",
      resourceId: newDivision.id,
      details: { siteId, code, name },
      ipAddress: getRequestIP(event) || event.node?.req?.socket?.remoteAddress || "unknown",
      userAgent: getHeader(event, "user-agent") || "unknown"
    }).catch(console.error);
    return {
      success: true,
      division: newDivision
    };
  } catch (error) {
    if (error.statusCode) throw error;
    console.error("Error creating division:", error);
    if (error.code === "23505") {
      throw createError({
        statusCode: 409,
        message: "Kode divisi sudah digunakan"
      });
    }
    if (error.code === "23503") {
      throw createError({
        statusCode: 400,
        message: "Site tidak ditemukan"
      });
    }
    throw createError({
      statusCode: 500,
      message: `Gagal membuat divisi: ${error.message || "Unknown error"}`
    });
  }
});
export {
  index_post_default as default
};
