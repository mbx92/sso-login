import { db, oidcKv, users } from "../db/index.js";
import { eq, and, gt } from "drizzle-orm";
import { randomBytes } from "crypto";
import { SignJWT, jwtVerify } from "jose";
const JWT_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "change-me-to-a-secure-random-string-at-least-32-chars"
);
const ISSUER = process.env.SSO_ISSUER || "http://localhost:3000";
function generateCode(length = 32) {
  return randomBytes(length).toString("base64url");
}
async function createAuthorizationCode(params) {
  const code = generateCode(32);
  const expiresAt = Date.now() + 10 * 60 * 1e3;
  const authCode = {
    code,
    clientId: params.clientId,
    userId: params.userId,
    redirectUri: params.redirectUri,
    scopes: params.scopes,
    nonce: params.nonce,
    codeChallenge: params.codeChallenge,
    codeChallengeMethod: params.codeChallengeMethod,
    expiresAt
  };
  await db.insert(oidcKv).values({
    model: "AuthorizationCode",
    key: code,
    payload: authCode,
    expiresAt: new Date(expiresAt)
  });
  return code;
}
async function verifyAuthorizationCode(params) {
  const [entry] = await db.select().from(oidcKv).where(
    and(
      eq(oidcKv.model, "AuthorizationCode"),
      eq(oidcKv.key, params.code),
      gt(oidcKv.expiresAt, /* @__PURE__ */ new Date())
    )
  ).limit(1);
  if (!entry) {
    return null;
  }
  const authCode = entry.payload;
  if (authCode.clientId !== params.clientId) {
    return null;
  }
  if (authCode.redirectUri !== params.redirectUri) {
    return null;
  }
  if (authCode.codeChallenge) {
    if (!params.codeVerifier) {
      return null;
    }
    const crypto = await import("crypto");
    const hash = crypto.createHash("sha256").update(params.codeVerifier).digest("base64url");
    if (hash !== authCode.codeChallenge) {
      return null;
    }
  }
  await db.delete(oidcKv).where(eq(oidcKv.id, entry.id));
  return authCode;
}
async function createAccessToken(params) {
  const expiresIn = 3600;
  const now = Math.floor(Date.now() / 1e3);
  const payload = {
    sub: params.userId,
    iss: ISSUER,
    aud: params.clientId,
    exp: now + expiresIn,
    iat: now,
    scope: params.scopes.join(" "),
    client_id: params.clientId
  };
  const token = await new SignJWT(payload).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setIssuedAt(now).setExpirationTime(now + expiresIn).sign(JWT_SECRET);
  return { token, expiresIn };
}
async function createIDToken(params) {
  const expiresIn = 3600;
  const now = Math.floor(Date.now() / 1e3);
  const [user] = await db.select().from(users).where(eq(users.id, params.userId)).limit(1);
  if (!user) {
    throw new Error("User not found");
  }
  const payload = {
    sub: user.id,
    iss: ISSUER,
    aud: params.clientId,
    exp: now + expiresIn,
    iat: now,
    scope: "openid profile email",
    client_id: params.clientId,
    email: user.email,
    name: user.name,
    employee_id: user.employeeId || void 0,
    department: user.department || void 0,
    position: user.position || void 0,
    avatar_url: user.avatarUrl || void 0,
    role_id: user.roleId || void 0,
    role_name: user.roleName || void 0
  };
  if (params.nonce) {
    payload.nonce = params.nonce;
  }
  const token = await new SignJWT(payload).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setIssuedAt(now).setExpirationTime(now + expiresIn).sign(JWT_SECRET);
  return { token, expiresIn };
}
async function createRefreshToken(params) {
  const token = generateCode(64);
  const expiresIn = 1209600;
  const expiresAt = Date.now() + expiresIn * 1e3;
  await db.insert(oidcKv).values({
    model: "RefreshToken",
    key: token,
    payload: {
      userId: params.userId,
      clientId: params.clientId,
      scopes: params.scopes
    },
    expiresAt: new Date(expiresAt)
  });
  return { token, expiresIn };
}
async function verifyRefreshToken(params) {
  const [entry] = await db.select().from(oidcKv).where(
    and(
      eq(oidcKv.model, "RefreshToken"),
      eq(oidcKv.key, params.token),
      gt(oidcKv.expiresAt, /* @__PURE__ */ new Date())
    )
  ).limit(1);
  if (!entry) {
    return null;
  }
  const payload = entry.payload;
  if (payload.clientId !== params.clientId) {
    return null;
  }
  await db.delete(oidcKv).where(eq(oidcKv.id, entry.id));
  return {
    userId: payload.userId,
    scopes: payload.scopes
  };
}
async function verifyAccessToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}
async function getUserInfo(userId) {
  const [user] = await db.select({
    sub: users.id,
    email: users.email,
    name: users.name,
    employee_id: users.employeeId,
    department: users.department,
    position: users.position,
    avatar_url: users.avatarUrl,
    role_id: users.roleId,
    role_name: users.roleName
  }).from(users).where(eq(users.id, userId)).limit(1);
  return user;
}
export {
  createAccessToken,
  createAuthorizationCode,
  createIDToken,
  createRefreshToken,
  generateCode,
  getUserInfo,
  verifyAccessToken,
  verifyAuthorizationCode,
  verifyRefreshToken
};
