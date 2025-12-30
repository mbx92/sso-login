# SSO Identity Provider (IdP)

Sistem Single Sign-On (SSO) berbasis OpenID Connect (OIDC) untuk aplikasi internal kantor.

## 🚀 Features

- **OIDC Authorization Code + PKCE** flow untuk keamanan maksimal
- **Admin UI** untuk manage users, OIDC clients, dan audit logs
- **Structured logging** dengan request tracing
- **Audit trail** untuk semua event penting
- **Rate limiting** untuk proteksi brute-force
- **HRIS sync** untuk sinkronisasi user dari sistem HR

## 📋 Tech Stack

- **Nuxt 3** - Fullstack Vue.js framework
- **Tailwind CSS + DaisyUI v4** - UI styling
- **Drizzle ORM** - Type-safe database access
- **PostgreSQL** - Database
- **oidc-provider** - Battle-tested OIDC library
- **Pino** - Structured JSON logging
- **Argon2** - Password hashing

## 🛠️ Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm atau pnpm

## ⚡ Quick Start

### 1. Clone & Install

```bash
cd sso-login
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env dengan konfigurasi yang sesuai
```

### 3. Setup Database

```bash
# Buat database PostgreSQL
createdb sso_db

# Jalankan migrations
npm run db:migrate

# Seed superadmin user
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Akses aplikasi di: http://localhost:3000

## 📁 Project Structure

```
sso-login/
├── app/
│   ├── assets/css/        # Global styles
│   ├── layouts/           # Page layouts
│   └── pages/             # Vue pages
│       ├── login.vue      # Login page
│       ├── consent.vue    # OAuth consent page
│       └── admin/         # Admin pages
├── server/
│   ├── api/               # API endpoints
│   │   ├── admin/         # Admin APIs
│   │   └── auth/          # Auth APIs
│   ├── db/                # Database
│   │   ├── schema.ts      # Drizzle schema
│   │   ├── migrations/    # SQL migrations
│   │   └── seed.ts        # Seed script
│   ├── middleware/        # Server middleware
│   ├── oidc/              # OIDC provider
│   │   ├── adapter.ts     # PostgreSQL adapter
│   │   ├── provider.ts    # Provider config
│   │   └── interactions.ts # Login/consent logic
│   ├── routes/            # Server routes
│   ├── services/          # Business logic
│   └── jobs/              # Background jobs
├── docs/                  # Documentation
├── drizzle.config.ts      # Drizzle config
├── nuxt.config.ts         # Nuxt config
└── .env.example           # Environment template
```

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@localhost:5432/sso_db` |
| `SSO_ISSUER` | OIDC issuer URL | `https://sso.company.local` |
| `SESSION_SECRET` | Session encryption key (32+ chars) | `your-secret-key-here` |
| `SUPERADMIN_EMAIL` | Initial admin email | `admin@company.com` |
| `SUPERADMIN_PASSWORD` | Initial admin password | `change-me-immediately` |
| `HRIS_API_BASE_URL` | HRIS API endpoint | `http://hris.internal` |
| `HRIS_API_TOKEN` | HRIS API auth token | `your-api-token` |
| `LOG_LEVEL` | Logging verbosity | `info` |

## 📝 Available Scripts

```bash
# Development
npm run dev           # Start dev server
npm run build         # Build for production
npm run preview       # Preview production build

# Database
npm run db:generate   # Generate migrations
npm run db:migrate    # Run migrations
npm run db:push       # Push schema changes
npm run db:seed       # Seed database
npm run db:studio     # Open Drizzle Studio

# Linting
npm run lint          # Run ESLint
npm run lint:fix      # Fix lint issues
```

## 🔐 OIDC Endpoints

| Endpoint | URL |
|----------|-----|
| Discovery | `/.well-known/openid-configuration` |
| Authorization | `/oidc/auth` |
| Token | `/oidc/token` |
| UserInfo | `/oidc/userinfo` |
| JWKS | `/oidc/jwks` |
| End Session | `/oidc/session/end` |
| Introspection | `/oidc/token/introspection` |
| Revocation | `/oidc/token/revocation` |

## 🧪 Testing OIDC Flow

### Manual Browser Test

1. Daftarkan client di Admin UI (`/admin/clients`)
2. Buka URL authorize:
   ```
   http://localhost:3000/oidc/auth?
     client_id=YOUR_CLIENT_ID&
     redirect_uri=YOUR_REDIRECT_URI&
     response_type=code&
     scope=openid%20profile%20email&
     code_challenge=YOUR_CODE_CHALLENGE&
     code_challenge_method=S256&
     state=random-state
   ```
3. Login dan approve consent
4. Exchange code untuk token

### cURL Test

```bash
# Get token (setelah dapat auth code)
curl -X POST http://localhost:3000/oidc/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=AUTH_CODE" \
  -d "redirect_uri=YOUR_REDIRECT_URI" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "code_verifier=YOUR_CODE_VERIFIER"

# Get user info
curl http://localhost:3000/oidc/userinfo \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## 📚 Documentation

- [Architecture Overview](docs/architecture.md)
- [Laravel Client Integration](docs/oidc-client-laravel.md)
- [Node.js Client Integration](docs/oidc-client-node.md)
- [Operations Guide](docs/operations.md)

## 🔒 Security Considerations

- Semua password di-hash dengan Argon2id
- PKCE wajib untuk semua OIDC flows
- Rate limiting pada endpoint login dan token
- Secure cookies (HttpOnly, Secure, SameSite)
- Audit logging untuk semua event penting
- Validasi redirect URI yang ketat

## 📄 License

Internal use only - PT Company Name
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
