# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SSO Identity Provider                          │
│                         (Nuxt 3 + oidc-provider)                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │   Login UI   │    │  Consent UI  │    │   Admin UI   │              │
│  │  (DaisyUI)   │    │  (DaisyUI)   │    │  (DaisyUI)   │              │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘              │
│         │                   │                   │                        │
│         └───────────────────┴───────────────────┘                        │
│                             │                                            │
│  ┌──────────────────────────▼────────────────────────────────────────┐  │
│  │                     Nuxt 3 Server (Nitro)                         │  │
│  ├───────────────────────────────────────────────────────────────────┤  │
│  │                                                                    │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │  │
│  │  │   Logging   │  │ Rate Limit  │  │    Auth     │               │  │
│  │  │ Middleware  │  │ Middleware  │  │ Middleware  │               │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘               │  │
│  │                                                                    │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │                    oidc-provider                             │  │  │
│  │  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │  │  │
│  │  │  │/auth   │ │/token  │ │/userinfo││/jwks   │ │/logout │    │  │  │
│  │  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘    │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  │                                                                    │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │                    Admin API                                 │  │  │
│  │  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │  │  │
│  │  │  │ Users  │ │Clients │ │Audit   │ │ HRIS   │               │  │  │
│  │  │  │  API   │ │  API   │ │Logs API│ │Sync API│               │  │  │
│  │  │  └────────┘ └────────┘ └────────┘ └────────┘               │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  │                                                                    │  │
│  └────────────────────────────┬───────────────────────────────────────┘  │
│                               │                                          │
└───────────────────────────────┼──────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
        ┌───────▼───────┐               ┌───────▼───────┐
        │  PostgreSQL   │               │   HRIS API    │
        │  (Database)   │               │   (Laravel)   │
        └───────────────┘               └───────────────┘
```

## OIDC Authorization Code + PKCE Flow

```
┌──────────┐                              ┌──────────┐                              ┌──────────┐
│          │                              │          │                              │          │
│  Client  │                              │   SSO    │                              │   User   │
│   App    │                              │   IdP    │                              │ Browser  │
│          │                              │          │                              │          │
└────┬─────┘                              └────┬─────┘                              └────┬─────┘
     │                                         │                                         │
     │  1. User clicks "Login with SSO"        │                                         │
     │ ◄───────────────────────────────────────┼─────────────────────────────────────────┤
     │                                         │                                         │
     │  2. Generate code_verifier & code_challenge (PKCE)                               │
     │────────────────────────────────────────►│                                         │
     │                                         │                                         │
     │  3. Redirect to /oidc/auth             │                                         │
     │    ?client_id=...                       │                                         │
     │    &redirect_uri=...                    │                                         │
     │    &response_type=code                  │                                         │
     │    &scope=openid profile email          │                                         │
     │    &code_challenge=...                  │                                         │
     │    &code_challenge_method=S256          │                                         │
     │    &state=...                           │                                         │
     │─────────────────────────────────────────►─────────────────────────────────────────►
     │                                         │                                         │
     │                                         │  4. Show Login Page                     │
     │                                         │◄────────────────────────────────────────┤
     │                                         │                                         │
     │                                         │  5. User enters credentials            │
     │                                         │────────────────────────────────────────►│
     │                                         │                                         │
     │                                         │  6. Validate credentials               │
     │                                         │────────────────────────────────────────►│
     │                                         │                                         │
     │                                         │  7. Show Consent Page (if required)    │
     │                                         │◄────────────────────────────────────────┤
     │                                         │                                         │
     │                                         │  8. User approves consent              │
     │                                         │────────────────────────────────────────►│
     │                                         │                                         │
     │  9. Redirect to client redirect_uri     │                                         │
     │    ?code=AUTH_CODE                      │                                         │
     │    &state=...                           │                                         │
     │◄─────────────────────────────────────────◄─────────────────────────────────────────│
     │                                         │                                         │
     │  10. POST /oidc/token                   │                                         │
     │      grant_type=authorization_code      │                                         │
     │      code=AUTH_CODE                     │                                         │
     │      redirect_uri=...                   │                                         │
     │      client_id=...                      │                                         │
     │      client_secret=...                  │                                         │
     │      code_verifier=...                  │                                         │
     │────────────────────────────────────────►│                                         │
     │                                         │                                         │
     │  11. Validate code & PKCE               │                                         │
     │                                         │                                         │
     │  12. Return tokens                      │                                         │
     │      {                                  │                                         │
     │        access_token: "...",             │                                         │
     │        id_token: "...",                 │                                         │
     │        refresh_token: "...",            │                                         │
     │        token_type: "Bearer",            │                                         │
     │        expires_in: 3600                 │                                         │
     │      }                                  │                                         │
     │◄────────────────────────────────────────┤                                         │
     │                                         │                                         │
     │  13. GET /oidc/userinfo                 │                                         │
     │      Authorization: Bearer ACCESS_TOKEN │                                         │
     │────────────────────────────────────────►│                                         │
     │                                         │                                         │
     │  14. Return user info                   │                                         │
     │      {                                  │                                         │
     │        sub: "user-id",                  │                                         │
     │        email: "user@example.com",       │                                         │
     │        name: "User Name",               │                                         │
     │        roles: ["admin"]                 │                                         │
     │      }                                  │                                         │
     │◄────────────────────────────────────────┤                                         │
     │                                         │                                         │
```

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      users      │       │   user_roles    │       │      roles      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │──────<│ user_id (FK)    │>──────│ id (PK)         │
│ employee_id     │       │ role_id (FK)    │       │ name            │
│ email           │       │ created_at      │       │ description     │
│ name            │       └─────────────────┘       │ created_at      │
│ status          │                                 │ updated_at      │
│ password_hash   │                                 └─────────────────┘
│ created_at      │
│ updated_at      │
└────────┬────────┘
         │
         │
         ▼
┌─────────────────┐
│   audit_logs    │
├─────────────────┤
│ id (PK)         │
│ at              │
│ actor_user_id   │───────────────────────────────────┐
│ actor_type      │                                   │
│ action          │                                   │
│ target_type     │                                   │
│ target_id       │                                   │
│ ip              │                                   │
│ user_agent      │                                   │
│ request_id      │                                   │
│ metadata (JSON) │                                   │
└─────────────────┘                                   │
                                                      │
┌─────────────────┐                                   │
│  oidc_clients   │                                   │
├─────────────────┤                                   │
│ id (PK)         │                                   │
│ client_id       │◄──────────────────────────────────┘
│ client_secret   │      (audit logs reference)
│ name            │
│ redirect_uris   │
│ grant_types     │
│ scopes          │
│ is_first_party  │
│ is_active       │
│ created_at      │
│ updated_at      │
└─────────────────┘

┌─────────────────┐
│     oidc_kv     │
├─────────────────┤
│ id (PK)         │       Generic key-value store for:
│ model           │       - Sessions
│ key             │       - Access Tokens
│ payload (JSON)  │       - Refresh Tokens
│ expires_at      │       - Authorization Codes
│ user_code       │       - Grants
│ uid             │       - Device Codes
│ grant_id        │
└─────────────────┘
```

## Security Model

### Authentication Layers

1. **End-User Authentication** (OIDC)
   - Email/Employee ID + Password
   - Password hashed with Argon2id
   - Session stored in encrypted cookie

2. **Admin Authentication**
   - Same as end-user + role check
   - Requires `superadmin` or `admin` role

3. **Client Authentication** (OIDC)
   - Client ID + Client Secret
   - Secret hashed with Argon2id
   - Supports: Basic, POST, none (public)

### Security Controls

| Control | Implementation |
|---------|----------------|
| Password Hashing | Argon2id (memory: 64MB, time: 3, parallelism: 4) |
| Session Security | HttpOnly, Secure, SameSite=Lax cookies |
| PKCE | Required for all authorization requests |
| Rate Limiting | 5 login attempts/min, 30 token requests/min |
| Redirect URI Validation | Exact match required |
| Token Expiry | Access: 1h, Refresh: 14d, Auth Code: 10m |
| Audit Logging | All auth events, admin actions, errors |

## Token Claims

### ID Token Claims

```json
{
  "iss": "https://sso.company.local",
  "sub": "user-uuid",
  "aud": "client-id",
  "exp": 1234567890,
  "iat": 1234567890,
  "auth_time": 1234567890,
  "nonce": "...",
  "at_hash": "...",
  "email": "user@example.com",
  "email_verified": true,
  "name": "User Name",
  "preferred_username": "user@example.com",
  "employee_id": "EMP001",
  "roles": ["admin", "user"]
}
```

### Access Token

Access tokens are opaque references. Use `/userinfo` endpoint or token introspection to get claims.
