var cors_default = defineEventHandler((event) => {
  const req = event.node?.req || event.req;
  const res = event.node?.res || event.res;
  const url = req.url || "";
  const origin = req.headers.origin;
  if (url.startsWith("/api/oidc/")) {
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Max-Age", "86400");
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }
  }
});
export {
  cors_default as default
};
