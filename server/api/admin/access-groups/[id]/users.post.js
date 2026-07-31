import { defineEventHandler, createError } from "h3";
import { db, accessGroupUsers } from "../../../../db/index.js";
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
var users_post_default = defineEventHandler(async (event) => {
  const user = getAuthUser(event);
  const groupId = event.context.params?.id;
  const body = await parseBody(event);
  if (!groupId) {
    throw createError({
      statusCode: 400,
      message: "Group ID is required"
    });
  }
  const { userId } = body;
  if (!userId) {
    console.error("[Add User to Group] User ID missing. Body:", body);
    throw createError({
      statusCode: 400,
      message: "User ID is required"
    });
  }
  try {
    const existing = await db.select().from(accessGroupUsers).where(
      and(
        eq(accessGroupUsers.groupId, groupId),
        eq(accessGroupUsers.userId, userId)
      )
    ).limit(1);
    if (existing.length > 0) {
      throw createError({
        statusCode: 400,
        message: "User is already in this group"
      });
    }
    const [newMember] = await db.insert(accessGroupUsers).values({
      groupId,
      userId,
      addedBy: user.id
    }).returning();
    return {
      success: true,
      data: newMember
    };
  } catch (error) {
    console.error("Failed to add user to group:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to add user to group"
    });
  }
});
export {
  users_post_default as default
};
