import { defineEventHandler } from "h3";
import { db } from "../db/index";
import { sql } from "drizzle-orm";
var health_get_default = defineEventHandler(async (event) => {
  const startTime = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    const responseTime = Date.now() - startTime;
    return {
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      checks: {
        database: "connected"
      }
    };
  } catch (error) {
    event.node.res.statusCode = 503;
    return {
      status: "unhealthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: process.uptime(),
      checks: {
        database: "disconnected"
      },
      error: error.message
    };
  }
});
export {
  health_get_default as default
};
