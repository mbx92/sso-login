import { defineEventHandler, createError } from "h3";
import { db, accessGroups } from "../../../db/index.js";
import { eq } from "drizzle-orm";
import { getAuthUser } from "../../../utils/auth.js";
async function parseBody(event) {
  const req = event.node?.req || event.req;
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}
var id_put_default = defineEventHandler(async (event) => {
  const user = getAuthUser(event);
  const groupId = event.context.params?.id;
  const body = await parseBody(event);
  if (!groupId) {
    throw createError({
      statusCode: 400,
      message: "Group ID is required"
    });
  }
  const { name, description, isActive } = body;
  try {
    const [updatedGroup] = await db.update(accessGroups).set({
      name: name || void 0,
      description: description !== void 0 ? description : void 0,
      isActive: isActive !== void 0 ? isActive : void 0,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(accessGroups.id, groupId)).returning();
    if (!updatedGroup) {
      throw createError({
        statusCode: 404,
        message: "Group not found"
      });
    }
    return {
      success: true,
      data: updatedGroup
    };
  } catch (error) {
    console.error("Failed to update access group:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to update access group"
    });
  }
});
export {
  id_put_default as default
};
