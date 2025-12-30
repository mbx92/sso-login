# Prompt untuk Agent: Bangun Sistem SSO Login (Nuxt + Tailwind + DaisyUI + Drizzle + Postgres)

Tanggal saat ini: 2025-12-30  
User login: mbx92

## Peran Agent
Kamu adalah software architect + fullstack engineer + security engineer. Tugasmu adalah membimbing dan (bila diminta) mengimplementasikan sistem **SSO (Single Sign-On)** untuk banyak aplikasi internal kantor.

Saya belum pernah membangun SSO. Jelaskan langkah-langkah secara terstruktur, beri rekomendasi arsitektur, dan pastikan solusi aman (security best practices), bisa diaudit (logging), dan bisa diintegrasikan ke sistem existing.

## Tujuan Produk (Problem Statement)
Bangun sebuah **SSO Identity Provider (IdP)** yang menjadi pusat login untuk banyak sistem/aplikasi kantor (Service Provider / SP). Sistem harus menyediakan:
- User Management (akun, status aktif/nonaktif, reset password, dsb)
- Authentication (login) dan Authorization (roles/permissions)
- Single sign-on lintas aplikasi
- Dukungan integrasi aplikasi baru dan aplikasi existing
- Logging/auditing untuk aktivitas penting (login, token issuance, perubahan user/role, kegagalan login, dll)

## Stack Teknis Wajib
- Frontend: **Nuxt.js**
- UI: **Tailwind CSS + DaisyUI v4**
- ORM: **Drizzle**
- Database: **PostgreSQL**
- Wajib ada: **logging** (structured logging) + audit trail

## Output yang Saya Mau dari Kamu
1. Pilih pendekatan/protokol SSO yang tepat untuk enterprise internal:
   - bandingkan minimal: **OIDC (OpenID Connect)** vs **SAML 2.0**
   - berikan rekomendasi yang paling cocok untuk stack Nuxt + aplikasi internal modern
2. Desain arsitektur end-to-end:
   - komponen (IdP, client apps/SP, database, session store bila perlu)
   - alur login, logout, token refresh
   - bagaimana single sign-out (jika relevan)
3. Desain data model (Postgres + Drizzle):
   - tabel user
   - tabel roles/permissions (RBAC)
   - tabel clients/applications (registered relying parties)
   - tabel sessions / refresh tokens / auth codes (sesuai protokol)
   - tabel audit_logs
4. Rekomendasi paket/library yang aman untuk implementasi OIDC di Node/Nuxt ecosystem.
   - Jelaskan tradeoff: build from scratch vs pakai library battle-tested.
5. Rencana implementasi bertahap (milestones) untuk pemula:
   - MVP yang realistis dulu
   - kemudian fitur lanjutan (MFA, device/session management, password policy, dsb)
6. Logging & audit:
   - definisikan event apa saja yang wajib dicatat
   - format log yang disarankan (JSON structured)
   - retensi, masking data sensitif, dan korelasi request (request_id/trace_id)
7. Security checklist:
   - password hashing (argon2/bcrypt)
   - CSRF, XSS, session fixation
   - rate limiting & brute-force protection
   - secure cookies, sameSite, CORS
   - key management (JWT signing keys / rotation)
   - environment/secrets handling

## Pertanyaan Penting yang Harus Kamu Jawab: Integrasi Sistem Existing yang Sudah Punya Auth Sendiri
Saya punya beberapa sistem yang sudah existing dan masing-masing sudah punya autentikasi sendiri. Saya ingin mereka bisa ikut SSO. Jelaskan opsi integrasi berikut (dengan kelebihan/kekurangan, effort, dan risiko):

### A) Migrasi penuh ke SSO
- aplikasi existing menyerahkan login ke IdP dan berhenti pakai login lama

### B) Federation / Delegation
- aplikasi existing tetap punya user lokal, tapi login menggunakan IdP (contoh: OIDC login) lalu melakukan account linking

### C) Gateway / Reverse proxy approach
- taruh auth gateway di depan aplikasi legacy untuk enforce SSO tanpa modifikasi besar aplikasi

### D) “Password sync” (jika kepikiran)
- jelaskan kenapa ini biasanya buruk/berisiko, dan alternatif yang lebih aman

Selain itu, jelaskan:
- strategi **mapping user identity** (email, employee_id, username)
- strategi **provisioning** (SCIM atau alternatif sederhana)
- cara menangani perbedaan authorization antar aplikasi (centralized vs per-app roles)
- langkah migrasi yang minim downtime

## Batasan/Asumsi
- Ini sistem internal kantor (intranet / VPN), tapi harus tetap mengikuti praktik keamanan yang benar.
- Saya ingin UI admin untuk mengelola users, roles, dan daftar aplikasi yang terhubung.
- Saya ingin dokumentasi alur integrasi untuk aplikasi client (contoh pseudo-code / langkah konfigurasi).

## Cara Kamu Menjawab
- Mulai dari gambaran besar, lalu detail.
- Sertakan diagram teks (ASCII) untuk flow OIDC authorization code + PKCE (jika dipilih).
- Berikan contoh konfigurasi dan contoh payload token (tanpa rahasia).
- Jika ada keputusan desain, jelaskan alasannya dan alternatifnya.

## Deliverables (Jika Saya Minta Implementasi)
Jika saya meminta implementasi, siapkan struktur project, modul-modul, dan contoh endpoint minimal:
- `/.well-known/openid-configuration` (jika OIDC)
- `/authorize`, `/token`, `/userinfo`, `/logout`
- UI login
- UI admin (users/roles/clients)
- audit logging middleware
Tetapi jangan menulis kode dulu sebelum saya menyetujui arsitektur dan protokol yang dipilih.