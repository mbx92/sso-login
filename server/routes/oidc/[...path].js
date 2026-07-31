import { defineEventHandler } from "h3";
import { getOidcProvider } from "../../oidc/provider.js";
var path_default = defineEventHandler(async (event) => {
  const provider = getOidcProvider();
  const callback = provider.callback();
  const req = event.node.req;
  const res = event.node.res;
  const originalUrl = req.url || "";
  return new Promise((resolve, reject) => {
    callback(req, res).then(() => {
      resolve(void 0);
    }).catch((error) => {
      event.context.logger?.error({ error }, "OIDC callback error");
      reject(error);
    });
  });
});
export {
  path_default as default
};
