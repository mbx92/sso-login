# Implementasikan Sistem SSO (OIDC) — Nuxt + Tailwind + DaisyUI4 + Drizzle + Postgres + Logging

Konteks:
- Mostly web apps
- Client apps: PHP (Laravel) dan Node
- HRIS existing: Laravel + MySQL (source of truth user)
- Target user: 600–700
- 3 site berbeda (kemungkinan beda domain/subdomain/region jaringan)
- Siapkan MFA (belum wajib di MVP)
- Stack wajib SSO app:
  - Nuxt.js
  - Tailwind CSS + DaisyUI v4
  - Drizzle ORM
  - PostgreSQL
  - Logging & audit trail

## 1) Tujuan PR
Buat implementasi MVP Identity Provider berbasis **OpenID Connect (OIDC)** dengan:
- Login UI + session
- OIDC endpoints minimal untuk client apps:
  - `/.well-known/openid-configuration`
  - `/authorize` (Authorization Code + PKCE)
  - `/token`
  - `/userinfo`
  - `/logout` (RP-initiated logout minimal; single logout advanced opsional)
- Admin UI:
  - Manage Users (read-only dulu dari hasil sync HRIS, atau create local untuk superadmin)
  - Manage Roles/Permissions (RBAC minimal)
  - Manage OIDC Clients (registered apps: client_id, secret jika confidential, redirect_uris, scopes)
- Logging:
  - Structured JSON logging untuk request/response metadata
  - Audit log untuk event security dan perubahan data

## 2) Keputusan Arsitektur (wajib)
### OIDC Server
- Gunakan library **oidc-provider** (battle-tested) untuk implementasi OIDC server di Node.
- Integrasikan ke Nuxt server runtime (Nitro) atau jalankan sebagai server Node di dalam project Nuxt.
- Simpan data (clients, sessions, auth codes, tokens, grants) di Postgres via adapter.

### App Structure
- Monorepo single app (Nuxt) yang berisi:
  - UI pages (login, consent, admin)
  - Server routes untuk OIDC provider + admin API
- Pisahkan modul:
  - `server/oidc/` untuk provider config, adapter, interactions (login/consent)
  - `server/db/` untuk drizzle schema + migrations
  - `server/middleware/` untuk logging, auth admin, rate-limit
  - `pages/` untuk UI

### Multi-site (3 site)
- Pastikan konfigurasi cookie & issuer mempertimbangkan:
  - issuer tunggal (disarankan) dengan domain yang bisa diakses semua site via VPN / internal DNS, mis: `https://sso.company.local`
  - jika beda domain total dan tidak bisa satu issuer, jelaskan opsi multi-issuer (tapi MVP fokus single issuer).
- Set cookie `Secure`, `HttpOnly`, `SameSite=Lax` (atau `None` jika cross-site redirect butuh, tapi perlu TLS).

## 3) Data Model (Drizzle + Postgres)
Buat schema Drizzle untuk tabel:
- `users`
  - id (uuid)
  - employee_id (string, unique, dari HRIS)
  - email (string, unique)
  - name
  - status (active/disabled)
  - created_at, updated_at
- `roles`
  - id, name, description
- `user_roles`
  - user_id, role_id (unique pair)
- `oidc_clients`
  - id (uuid)
  - client_id (string unique)
  - client_secret_hash (nullable; confidential only)
  - name
  - redirect_uris (text/jsonb)
  - post_logout_redirect_uris (text/jsonb)
  - grant_types (text/jsonb)
  - response_types (text/jsonb)
  - scopes (text/jsonb)
  - token_endpoint_auth_method
  - created_at, updated_at
- `audit_logs`
  - id (uuid)
  - at (timestamp)
  - actor_user_id (nullable)
  - actor_type (user/system)
  - action (string)
  - target_type (string)
  - target_id (string nullable)
  - ip (string)
  - user_agent (text)
  - request_id (string)
  - metadata (jsonb)
- Tabel OIDC persistence (pilih salah satu):
  A) Implement adapter oidc-provider ke Postgres via tabel generik `oidc_kv` (model,key, payload jsonb, expires_at)
  B) Buat tabel per artifact (lebih kompleks).
  Untuk MVP pilih A.

Tambahkan migrations awal.

## 4) AuthN & AuthZ
### Admin Authentication
- MVP: user login menggunakan password lokal untuk superadmin (1 user bootstrap via env), sementara user HRIS disync sebagai read-only.
- Next: enable passwordless/email OTP atau integrate ke HRIS credential (tidak disarankan sync password).
- Admin authorization: RBAC minimal:
  - role `superadmin` bisa manage clients & roles
  - role `admin` bisa view user dan audit logs

### End-user Authentication (untuk OIDC)
- Login page untuk user (email/employee_id + password lokal atau OTP).
- Karena user source HRIS sudah ada, MVP paling aman:
  - HRIS jadi source of truth identitas (employee_id/email)
  - Credential untuk SSO dikelola terpisah (create initial password + reset flow) ATAU gunakan email OTP.
- Implement basic password reset flow (opsional di MVP; minimal endpoint stub + audit log).

## 5) HRIS Sync (Laravel+MySQL)
Implement job sinkronisasi:
- Mode 1 (disarankan): HRIS expose endpoint internal `GET /api/employees` secured by token; SSO menarik data periodik.
- Mode 2: direct DB connection (hindari jika bisa).
MVP:
- Buat `server/jobs/sync-hris.ts` + endpoint manual `/admin/sync/hris` (protected) untuk trigger sync.
- Simpan `employee_id`, `email`, `name`, `status`.
- Audit log setiap sync run (counts inserted/updated/disabled).

## 6) Logging
### Structured app log
- Gunakan pino (atau consola) untuk JSON logs.
- Tambahkan middleware:
  - generate `request_id`
  - log method, path, status, duration_ms
  - jangan log body untuk endpoint sensitif (`/token`, login)
- Pastikan masking:
  - password, authorization header, cookies.

### Audit log events minimal
- AUTH_LOGIN_SUCCESS / AUTH_LOGIN_FAILED
- OIDC_AUTHORIZE_SUCCESS / FAILED
- OIDC_TOKEN_ISSUED / FAILED
- OIDC_LOGOUT
- ADMIN_CREATE_CLIENT / UPDATE_CLIENT / DELETE_CLIENT
- ADMIN_ROLE_CHANGED / USER_ROLE_CHANGED
- HRIS_SYNC_RUN

## 7) Security baseline
- Hash password: argon2id
- Rate limit login + token endpoint
- CSRF protection untuk form login/consent
- Secure cookies
- Key management:
  - JWT signing keys via JWK (generate on first run or via env)
  - rencana rotation (doc)
- Validasi redirect_uris ketat.

## 8) UI (Nuxt + Tailwind + DaisyUI4)
Buat halaman:
- `/login` (daisyUI form)
- `/consent` (jika scope meminta; bisa auto-approve untuk first-party pada MVP dengan flag)
- `/admin` layout
  - `/admin/users`
  - `/admin/clients`
  - `/admin/audit-logs`
  - `/admin/settings` (issuer, jwks info read-only)

## 9) Dokumentasi (wajib ditambahkan ke repo)
Tambahkan:
- `README.md` (cara run local, env vars, migrate db, seed superadmin)
- `docs/oidc-client-laravel.md` (cara integrasi Laravel app sebagai OIDC client)
- `docs/oidc-client-node.md` (cara integrasi Node app)
- `docs/architecture.md` (flow diagram + tabel endpoint)
- `docs/operations.md` (logging, audit, backup db, key rotation plan)

## 10) Env Vars yang harus dibuat
- `DATABASE_URL=postgres://...`
- `SSO_ISSUER=https://sso.<domain>`
- `SESSION_SECRET=...`
- `SUPERADMIN_EMAIL=...`
- `SUPERADMIN_PASSWORD=...` (hanya untuk bootstrap; sarankan rotate)
- `HRIS_API_BASE_URL=...`
- `HRIS_API_TOKEN=...`
- `LOG_LEVEL=info`

## 11) Kriteria Selesai (Definition of Done)
- Server bisa start, migrasi jalan
- Login UI bisa dipakai
- Client OIDC bisa didaftarkan via admin UI
- OIDC Authorization Code + PKCE flow sukses (end-to-end) dan bisa ambil `/userinfo`
- Audit log terisi untuk event penting
- Docs tersedia untuk Laravel dan Node

## 12) Jangan lakukan (Out of Scope MVP)
- MFA full implementation (hanya “hooks/placeholder” + desain)
- SCIM full (cukup sync job sederhana)
- Multi-tenant kompleks (kecuali disiapkan field `site_id` bila perlu)