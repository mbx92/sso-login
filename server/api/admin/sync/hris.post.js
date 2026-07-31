import { defineEventHandler, createError } from "h3";
import { syncHrisUsers } from "../../../jobs/sync-hris.js";
var hris_post_default = defineEventHandler(async (event) => {
  try {
    const result = await syncHrisUsers(event.context.requestId);
    if (!result.success) {
      return {
        success: false,
        message: "HRIS sync completed with errors",
        result
      };
    }
    return {
      success: true,
      message: "HRIS sync completed successfully",
      result
    };
  } catch (error) {
    event.context.logger?.error({ error }, "Failed to run HRIS sync");
    throw createError({
      statusCode: 500,
      message: `HRIS sync failed: ${error.message}`
    });
  }
});
export {
  hris_post_default as default
};
