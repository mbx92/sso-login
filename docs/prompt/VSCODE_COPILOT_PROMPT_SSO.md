# Prompt Copilot VS Code: Implementasi SSO OIDC (Nuxt + Tailwind + DaisyUI4 + Drizzle + Postgres)

Kamu adalah senior fullstack engineer + security engineer. Bantu saya mengimplementasikan aplikasi baru: **SSO Identity Provider (IdP)** untuk kantor menggunakan **OpenID Connect (OIDC)**.

Konteks:
- Mostly web apps
- Client apps existing: PHP (Laravel) dan Node
- HRIS existing: Laravel + MySQL sebagai source-of-truth user (untuk MVP cukup stub sync)
- User 600–700, 3 site
- MFA belum wajib tapi siapkan “hook/desain”
- Domain issuer pakai placeholder dulu

Stack wajib:
- Nuxt 3 (fullstack)
- Tailwind CSS + DaisyUI v4
- Drizzle ORM
- PostgreSQL
- Logging terstruktur (JSON) + audit trail (DB)

## Target MVP Features
1) Implement **OIDC Authorization Code + PKCE** menggunakan library battle-tested **oidc-provider**.
   Endpoint minimal:
   - `/.well-known/openid-configuration`
   - `/authorize`
   - `/token`
   - `/userinfo`
   - `/logout` (RP-initiated logout minimal)

2) Interactions (login/consent) terintegrasi UI Nuxt:
   - `/login` halaman login (DaisyUI)
   - consent page bila diperlukan (boleh auto-approve untuk first-party pada MVP via flag)

3) Admin UI (DaisyUI):
   - `/admin/users` (list user, read-only MVP)
   - `/admin/clients` (CRUD OIDC clients: client_id, secret, redirect URIs, scopes, grant types)
   - `/admin/audit-logs` (lihat audit logs)
   - Tambahkan admin auth + RBAC minimal (role `superadmin`, `admin`)

4) Database (Drizzle + Postgres) + migrations:
   Buat tabel:
   - `users`: id uuid, employee_id unique nullable, email unique, name, status, password_hash nullable, created_at, updated_at
   - `roles`
   - `user_roles`
   - `oidc_clients`: client_id unique, client_secret_hash nullable, redirect_uris jsonb, post_logout_redirect_uris jsonb, grant_types/response_types/scopes jsonb, token_endpoint_auth_method, timestamps
   - `audit_logs`: id, at, actor_user_id nullable, actor_type, action, target_type, target_id, ip, user_agent, request_id, metadata jsonb
   - `oidc_kv`: model, key, payload jsonb, expires_at (adapter persistence untuk oidc-provider)

5) Logging
   - Gunakan `pino` untuk structured JSON logs
   - Middleware: buat `request_id`, log method/path/status/duration
   - Masking data sensitif (password, Authorization header, cookies)
   - Audit log event minimal:
     - AUTH_LOGIN_SUCCESS / AUTH_LOGIN_FAILED
     - OIDC_AUTHORIZE_* / OIDC_TOKEN_ISSUED / OIDC_TOKEN_FAILED
     - ADMIN_CLIENT_CREATED/UPDATED/DELETED
     - HRIS_SYNC_RUN (stub)

6) HRIS Sync (stub MVP)
   - Buat job `server/jobs/sync-hris.ts` yang memanggil API HRIS (placeholder)
   - Tambah endpoint admin `POST /admin/sync/hris` (protected) untuk trigger manual
   - Env: `HRIS_API_BASE_URL`, `HRIS_API_TOKEN`

7) Security baseline
   - Password hashing: argon2id
   - Rate limiting minimal (in-memory) untuk `/login` dan `/token`
   - Secure cookies (HttpOnly, Secure in prod, SameSite)
   - CSRF protection untuk form login/consent
   - Issuer dari env `SSO_ISSUER` (placeholder)
   - Validasi redirect URIs ketat

## Instruksi Eksekusi (step-by-step)
Kerjakan bertahap dan pastikan build selalu hijau.
1) Inisialisasi project Nuxt 3.
2) Setup Tailwind + DaisyUI v4.
3) Setup Drizzle + Postgres + migrations.
4) Implement schema tabel di atas + seed superadmin dari env.
5) Implement logging middleware + audit log helper.
6) Integrasikan `oidc-provider`:
   - buat konfigurasi provider
   - implement adapter Postgres berbasis `oidc_kv`
   - implement interactions: login + consent
7) Buat Admin UI + API (CRUD clients, view users, view audit logs).
8) Tambahkan docs:
   - `README.md`
   - `docs/architecture.md` (flow OIDC code+PKCE)
   - `docs/oidc-client-laravel.md`
   - `docs/oidc-client-node.md`
   - `docs/operations.md`
9) Buat contoh `.env.example` lengkap.

## Batasan
- Jangan implement MFA penuh sekarang (cukup desain + placeholder).
- Jangan lakukan password sync dengan HRIS.
- Fokus MVP: SSO OIDC jalan end-to-end.

## Konvensi Folder yang Diinginkan
- `server/db/*` (drizzle client, schema, migrations)
- `server/oidc/*` (provider config, adapter, interactions)
- `server/middleware/*` (logging, auth admin, rate limit)
- `server/services/*` (audit logger, user service)
- `pages/*` (login, admin)
- `docs/*`

## Env vars yang harus disediakan
- `DATABASE_URL=postgres://...`
- `SSO_ISSUER=https://sso.placeholder.local`
- `SESSION_SECRET=...`
- `SUPERADMIN_EMAIL=admin@example.com`
- `SUPERADMIN_PASSWORD=change-me`
- `HRIS_API_BASE_URL=http://hris.local`
- `HRIS_API_TOKEN=...`
- `LOG_LEVEL=info`

## Output yang Saya Minta dari Kamu (Copilot)
- Buat file-file yang diperlukan (kode + konfigurasi + docs).
- Sertakan perintah run & migrate.
- Berikan contoh cara test OIDC flow menggunakan `curl` atau langkah manual (browser) + contoh client config.
- Setiap kali selesai satu milestone, ringkas apa yang sudah dibuat dan apa langkah berikutnya.