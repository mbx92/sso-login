import { defineEventHandler, createError } from "h3";
import { db, accessGroupClients } from "../../../../db/index.js";
import { eq, and } from "drizzle-orm";
import { getAuthUser } from "../../../../utils/auth.js";
async function parseBody(event) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const req = event.node?.req || event.req;
    req.on("data", (chunk) => {
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        const bodyString = Buffer.concat(chunks).toString();
        if (bodyString === "") {
          resolve({});
        } else {
          resolve(JSON.parse(bodyString));
        }
      } catch (error) {
        console.error("[parseBody] JSON parse error:", error);
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}
var clients_post_default = defineEventHandler(async (event) => {
  const user = getAuthUser(event);
  const groupId = event.context.params?.id;
  const body = await parseBody(event);
  if (!groupId) {
    throw createError({
      statusCode: 400,
      message: "Group ID is required"
    });
  }
  const { clientId } = body;
  if (!clientId) {
    throw createError({
      statusCode: 400,
      message: "Client ID is required"
    });
  }
  try {
    const existing = await db.select().from(accessGroupClients).where(
      and(
        eq(accessGroupClients.groupId, groupId),
        eq(accessGroupClients.clientId, clientId)
      )
    ).limit(1);
    if (existing.length > 0) {
      throw createError({
        statusCode: 400,
        message: "Client is already in this group"
      });
    }
    const [newMember] = await db.insert(accessGroupClients).values({
      groupId,
      clientId,
      addedBy: user.id
    }).returning();
    return {
      success: true,
      data: newMember
    };
  } catch (error) {
    console.error("Failed to add client to group:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to add client to group"
    });
  }
});
export {
  clients_post_default as default
};
