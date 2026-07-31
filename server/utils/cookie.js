function shouldUseSecureCookies() {
  const cookieSecureEnv = process.env.COOKIE_SECURE;
  if (cookieSecureEnv !== void 0 && cookieSecureEnv !== "") {
    return cookieSecureEnv.toLowerCase() === "true";
  }
  return process.env.NODE_ENV === "production";
}
export {
  shouldUseSecureCookies
};
