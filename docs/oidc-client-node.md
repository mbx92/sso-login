# Integrasi OIDC Client - Node.js

Panduan untuk mengintegrasikan aplikasi Node.js dengan SSO IdP menggunakan OpenID Connect.

## Library Options

| Library | Use Case | Recommendation |
|---------|----------|----------------|
| `openid-client` | Generic OIDC client | ✅ Recommended |
| `passport-openidconnect` | Express + Passport | Good for existing Passport apps |
| `@auth0/nextjs-auth0` | Next.js | Good for Next.js apps |
| `nuxt-auth-utils` | Nuxt 3 | Good for Nuxt apps |

## Option 1: openid-client (Recommended)

### Instalasi

```bash
npm install openid-client
```

### Konfigurasi

```typescript
// lib/oidc.ts
import { Issuer, Client, generators } from 'openid-client';

const SSO_ISSUER = process.env.SSO_ISSUER || 'https://sso.company.local';
const CLIENT_ID = process.env.SSO_CLIENT_ID!;
const CLIENT_SECRET = process.env.SSO_CLIENT_SECRET!;
const REDIRECT_URI = process.env.SSO_REDIRECT_URI!;

let client: Client;

export async function getOidcClient(): Promise<Client> {
  if (client) return client;

  // Discover issuer configuration
  const issuer = await Issuer.discover(SSO_ISSUER);
  
  console.log('Discovered issuer:', issuer.metadata.issuer);

  // Create client
  client = new issuer.Client({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uris: [REDIRECT_URI],
    response_types: ['code'],
    token_endpoint_auth_method: 'client_secret_basic',
  });

  return client;
}

export function generatePkce(): { verifier: string; challenge: string } {
  const verifier = generators.codeVerifier();
  const challenge = generators.codeChallenge(verifier);
  return { verifier, challenge };
}

export function generateState(): string {
  return generators.state();
}

export function generateNonce(): string {
  return generators.nonce();
}
```

### Express Integration

```typescript
// app.ts
import express from 'express';
import session from 'express-session';
import { getOidcClient, generatePkce, generateState, generateNonce } from './lib/oidc';

const app = express();

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Extend session type
declare module 'express-session' {
  interface SessionData {
    codeVerifier: string;
    state: string;
    nonce: string;
    user?: {
      id: string;
      email: string;
      name: string;
      roles: string[];
    };
  }
}

// Login route - redirect to SSO
app.get('/auth/login', async (req, res) => {
  try {
    const client = await getOidcClient();
    
    // Generate PKCE
    const { verifier, challenge } = generatePkce();
    const state = generateState();
    const nonce = generateNonce();

    // Store in session
    req.session.codeVerifier = verifier;
    req.session.state = state;
    req.session.nonce = nonce;

    // Build authorization URL
    const authUrl = client.authorizationUrl({
      scope: 'openid profile email roles',
      state: state,
      nonce: nonce,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });

    res.redirect(authUrl);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).send('Authentication failed');
  }
});

// Callback route - handle SSO response
app.get('/auth/callback', async (req, res) => {
  try {
    const client = await getOidcClient();

    // Get params from URL
    const params = client.callbackParams(req);

    // Verify state
    if (params.state !== req.session.state) {
      throw new Error('State mismatch');
    }

    // Exchange code for tokens
    const tokenSet = await client.callback(
      process.env.SSO_REDIRECT_URI!,
      params,
      {
        code_verifier: req.session.codeVerifier,
        state: req.session.state,
        nonce: req.session.nonce,
      }
    );

    console.log('Token received:', {
      accessToken: tokenSet.access_token?.substring(0, 20) + '...',
      expiresIn: tokenSet.expires_in,
    });

    // Get user info
    const userinfo = await client.userinfo(tokenSet.access_token!);

    // Store user in session
    req.session.user = {
      id: userinfo.sub,
      email: userinfo.email as string,
      name: userinfo.name as string,
      roles: (userinfo.roles as string[]) || [],
    };

    // Clear temporary session data
    delete req.session.codeVerifier;
    delete req.session.state;
    delete req.session.nonce;

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Callback error:', error);
    res.redirect('/login?error=auth_failed');
  }
});

// Logout route
app.get('/auth/logout', async (req, res) => {
  try {
    const client = await getOidcClient();

    // Clear local session
    req.session.destroy(() => {});

    // Redirect to SSO logout
    const logoutUrl = client.endSessionUrl({
      post_logout_redirect_uri: process.env.APP_URL,
    });

    res.redirect(logoutUrl);
  } catch (error) {
    console.error('Logout error:', error);
    res.redirect('/');
  }
});

// Protected route example
app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }

  res.json({
    message: 'Welcome to dashboard',
    user: req.session.user,
  });
});

// User info route
app.get('/api/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  res.json(req.session.user);
});

app.listen(3000, () => {
  console.log('App running on http://localhost:3000');
});
```

### Authentication Middleware

```typescript
// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    if (req.accepts('html')) {
      return res.redirect('/auth/login');
    }
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

export function requireRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRoles = req.session.user.roles || [];
    const hasRole = roles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

// Usage:
// app.get('/admin', requireAuth, requireRoles('admin', 'superadmin'), adminController);
```

## Option 2: Passport.js

### Instalasi

```bash
npm install passport passport-openidconnect express-session
```

### Konfigurasi

```typescript
// config/passport.ts
import passport from 'passport';
import { Strategy as OpenIDConnectStrategy } from 'passport-openidconnect';

passport.use('sso', new OpenIDConnectStrategy({
    issuer: process.env.SSO_ISSUER!,
    authorizationURL: `${process.env.SSO_ISSUER}/oidc/auth`,
    tokenURL: `${process.env.SSO_ISSUER}/oidc/token`,
    userInfoURL: `${process.env.SSO_ISSUER}/oidc/userinfo`,
    clientID: process.env.SSO_CLIENT_ID!,
    clientSecret: process.env.SSO_CLIENT_SECRET!,
    callbackURL: process.env.SSO_REDIRECT_URI!,
    scope: ['openid', 'profile', 'email', 'roles'],
    pkce: true,
  },
  (issuer, profile, done) => {
    // Map profile ke user object
    const user = {
      id: profile.id,
      email: profile.emails?.[0]?.value,
      name: profile.displayName,
      roles: profile._json?.roles || [],
    };
    return done(null, user);
  }
));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user as Express.User);
});

export default passport;
```

### Express App

```typescript
// app.ts
import express from 'express';
import session from 'express-session';
import passport from './config/passport';

const app = express();

app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get('/auth/login', passport.authenticate('sso'));

app.get('/auth/callback',
  passport.authenticate('sso', { failureRedirect: '/login?error=1' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

app.get('/auth/logout', (req, res) => {
  req.logout(() => {
    res.redirect(`${process.env.SSO_ISSUER}/oidc/session/end?post_logout_redirect_uri=${process.env.APP_URL}`);
  });
});

app.get('/dashboard', 
  (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.redirect('/auth/login');
    }
    next();
  },
  (req, res) => {
    res.json({ user: req.user });
  }
);
```

## Option 3: Nuxt 3 (nuxt-auth-utils)

### Instalasi

```bash
npx nuxi module add auth-utils
```

### Konfigurasi

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-auth-utils'],
  
  runtimeConfig: {
    oauth: {
      sso: {
        clientId: process.env.SSO_CLIENT_ID,
        clientSecret: process.env.SSO_CLIENT_SECRET,
        redirectURL: process.env.SSO_REDIRECT_URI,
      }
    },
    session: {
      password: process.env.SESSION_SECRET,
    }
  }
});
```

### OAuth Event Handler

```typescript
// server/routes/auth/sso.get.ts
export default defineOAuthSSOEventHandler({
  config: {
    authorizationURL: `${process.env.SSO_ISSUER}/oidc/auth`,
    tokenURL: `${process.env.SSO_ISSUER}/oidc/token`,
    userURL: `${process.env.SSO_ISSUER}/oidc/userinfo`,
    scope: ['openid', 'profile', 'email', 'roles'],
    pkce: true,
  },
  async onSuccess(event, { user, tokens }) {
    await setUserSession(event, {
      user: {
        id: user.sub,
        email: user.email,
        name: user.name,
        roles: user.roles || [],
      },
    });
    return sendRedirect(event, '/dashboard');
  },
  onError(event, error) {
    console.error('SSO error:', error);
    return sendRedirect(event, '/login?error=auth_failed');
  },
});
```

### Composable Usage

```vue
<script setup>
const { loggedIn, user, session, clear } = useUserSession();

async function logout() {
  await clear();
  // Redirect to SSO logout
  window.location.href = `${useRuntimeConfig().public.ssoIssuer}/oidc/session/end`;
}
</script>

<template>
  <div v-if="loggedIn">
    <p>Welcome, {{ user.name }}</p>
    <button @click="logout">Logout</button>
  </div>
  <div v-else>
    <a href="/auth/sso">Login with SSO</a>
  </div>
</template>
```

## Environment Variables

```env
# SSO Configuration
SSO_ISSUER=https://sso.company.local
SSO_CLIENT_ID=your-client-id
SSO_CLIENT_SECRET=your-client-secret
SSO_REDIRECT_URI=https://your-app.com/auth/callback

# Session
SESSION_SECRET=your-session-secret-32-chars-min

# App
APP_URL=https://your-app.com
NODE_ENV=production
```

## Token Refresh

```typescript
// lib/token-refresh.ts
import { getOidcClient } from './oidc';

export async function refreshTokens(refreshToken: string) {
  const client = await getOidcClient();
  
  const tokenSet = await client.refresh(refreshToken);
  
  return {
    accessToken: tokenSet.access_token,
    refreshToken: tokenSet.refresh_token || refreshToken,
    expiresAt: tokenSet.expires_at,
  };
}

// Middleware untuk auto-refresh
export function autoRefreshMiddleware(req, res, next) {
  const session = req.session;
  
  if (!session.tokens) {
    return next();
  }

  // Check if token expires in next 5 minutes
  const expiresAt = session.tokens.expiresAt * 1000;
  const fiveMinutes = 5 * 60 * 1000;
  
  if (Date.now() > expiresAt - fiveMinutes) {
    refreshTokens(session.tokens.refreshToken)
      .then(newTokens => {
        session.tokens = newTokens;
        next();
      })
      .catch(err => {
        console.error('Token refresh failed:', err);
        // Clear session and redirect to login
        req.session.destroy();
        res.redirect('/auth/login');
      });
  } else {
    next();
  }
}
```

## Testing

### Unit Test

```typescript
// tests/auth.test.ts
import { describe, it, expect, vi } from 'vitest';
import { getOidcClient, generatePkce } from '../lib/oidc';

describe('OIDC Client', () => {
  it('should generate valid PKCE', () => {
    const { verifier, challenge } = generatePkce();
    
    expect(verifier).toHaveLength(43);
    expect(challenge).toBeDefined();
  });

  it('should discover issuer', async () => {
    const client = await getOidcClient();
    
    expect(client.issuer.metadata.issuer).toBe(process.env.SSO_ISSUER);
    expect(client.issuer.metadata.authorization_endpoint).toBeDefined();
    expect(client.issuer.metadata.token_endpoint).toBeDefined();
  });
});
```

### Integration Test

```bash
# Verify OIDC discovery
curl https://sso.company.local/.well-known/openid-configuration | jq

# Get authorization URL
node -e "
const { generators } = require('openid-client');
const verifier = generators.codeVerifier();
const challenge = generators.codeChallenge(verifier);
console.log('Verifier:', verifier);
console.log('Challenge:', challenge);
"
```

## Troubleshooting

### Error: "invalid_client"

- Verifikasi CLIENT_ID dan CLIENT_SECRET
- Pastikan client terdaftar dan active di SSO

### Error: "invalid_grant"

- Authorization code sudah expired (10 menit)
- Code sudah digunakan sebelumnya
- PKCE verifier tidak cocok dengan challenge

### Error: "access_denied"

- User menolak consent
- Redirect URI tidak cocok

### Session tidak persist

- Pastikan session middleware dikonfigurasi dengan benar
- Cek cookie settings (secure, sameSite)
