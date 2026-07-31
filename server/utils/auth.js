function getAuthUser(event) {
  try {
    const cookieHeader = event.node.req.headers.cookie;
    if (!cookieHeader) return null;
    const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      if (key && value) acc[key] = value;
      return acc;
    }, {});
    const userCookie = cookies["sso_user"];
    if (!userCookie) return null;
    const decoded = decodeURIComponent(userCookie);
    const user = JSON.parse(decoded);
    return user;
  } catch (error) {
    console.error("Error getting auth user:", error);
    return null;
  }
}
function requireAuthUser(event) {
  const user = getAuthUser(event);
  if (!user) {
    throw createError({
      statusCode: 401,
      message: "Authentication required"
    });
  }
  return user;
}
export {
  getAuthUser,
  requireAuthUser
};
