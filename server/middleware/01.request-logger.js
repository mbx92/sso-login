import { defineEventHandler } from "h3";
import { v4 as uuidv4 } from "uuid";
import { logRequest, createRequestLogger } from "../services/logger.js";
var request_logger_default = defineEventHandler((event) => {
  const requestId = event.node.req.headers["x-request-id"] || uuidv4();
  const startTime = Date.now();
  const path = event.node.req.url || "/";
  event.context.requestId = requestId;
  event.context.requestStartTime = startTime;
  event.context.logger = createRequestLogger(requestId, {
    method: event.method,
    path
  });
  event.node.res.setHeader("x-request-id", requestId);
  event.context.logger.debug({
    method: event.method,
    url: path,
    userAgent: event.node.req.headers["user-agent"],
    ip: event.node.req.headers["x-forwarded-for"] || event.node.req.socket.remoteAddress
  }, "Request started");
  event.node.res.on("finish", () => {
    const duration = Date.now() - startTime;
    if (path.startsWith("/_nuxt/") || path.startsWith("/__nuxt") || path === "/health") {
      return;
    }
    logRequest(
      event.method,
      path,
      event.node.res.statusCode,
      duration,
      requestId,
      {
        userAgent: event.node.req.headers["user-agent"],
        ip: event.node.req.headers["x-forwarded-for"] || event.node.req.socket.remoteAddress
      }
    );
  });
});
export {
  request_logger_default as default
};
