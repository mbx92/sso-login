import { defineEventHandler } from "h3";
import { getOidcProvider } from "../../oidc/provider.js";
var openid_configuration_default = defineEventHandler(async (event) => {
  const provider = getOidcProvider();
  const callback = provider.callback();
  const req = event.node.req;
  const res = event.node.res;
  return new Promise((resolve, reject) => {
    callback(req, res).then(() => resolve(void 0)).catch(reject);
  });
});
export {
  openid_configuration_default as default
};
