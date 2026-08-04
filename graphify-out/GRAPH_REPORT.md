# Graph Report - /Users/mbx/Projects/sso-login  (2026-08-04)

## Corpus Check
- 2 files · ~90,621 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1318 nodes · 1942 edges · 151 communities (88 shown, 63 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Admin User Access UI
- OIDC Interaction Routes
- Admin Check Scripts
- Dropdown Menu UI
- OIDC Auth Endpoints
- Select Component UI
- Nuxt SSO Client Package
- Admin Clients API
- Divisions Units API
- Admin Users Page
- Admin Divisions Page
- Admin Sites Page
- Admin Clients Page
- Admin Roles Page
- Root Package Metadata
- Admin Units Page
- Card UI Components
- Table and Dialog UI
- Site Admin Scripts
- Admin Layout Shell
- Legacy User Access UI
- Admin Sessions Page
- Sheet Component UI
- Login Page Flow
- Shadcn Components Config
- Input Components
- Checkbox and Label UI
- Admin Roles API
- SSO Client Callbacks
- DB Schema Relations
- Core Dependencies
- Switch Component UI
- Legacy HRIS Import
- Dialog Title Triggers
- Textarea Components
- Audit Logs Page
- OIDC Client Guides
- JSConfig Paths
- Confirm Modal Button
- Badge Components
- Alert Components
- Dialog Content Overlay
- Dropdown Menu Items
- Sheet Content Panel
- Tabs Component UI
- Popover Component UI
- Tooltip Component UI
- Avatar Component UI
- OIDC Provider Setup
- Docker Compose Stack
- Nuxt SSO Module Docs
- Publish Workflow CI
- Password Reset Flow
- Access Denied Page
- Nuxt OIDC Integration
- TSConfig Paths
- Dialog Scroll Content
- USelect Wrapper
- Access Group Membership
- Apps Launcher Page
- MiniMax Design System
- Access Groups Model
- SSO System Architecture
- App Shell Sonner
- App Logo Component
- Error Modal Component
- Dialog Root
- Dialog Description
- Separator Component
- Auth Global Middleware
- Admin Settings Page
- Resolve User Example
- Check Client Script
- Enable Access Control
- Grant User Access Script
- List User Access Script
- Set HRIS Passwords
- Show Users Script
- Update Client Redirect
- Client Confidential Mode
- Client Public Mode
- DB Migrate Runner
- Migration 0003 Runner
- Skeleton Component
- Access Group CRUD
- SSO Client Module Setup
- Check Drizzle Table
- Check Migrations Script
- Fix Migration Tracking
- Mark Migration Applied
- Apply Migration 0001
- Apply Sites Migration
- Check Tables Script
- Table Utils Helper
- Bulk Client Selector
- Bulk User Selector
- Logout Page
- Dep bcryptjs
- Dep better-sqlite3
- Dep class-variance-authority
- Dep clsx
- Dep cookie-parser
- Dep eslint
- Dep jose
- Dep lucide-vue-next
- Dep nuxt content
- Dep nuxt eslint
- Dep nuxt hints
- Dep nuxt image
- Dep nuxt test-utils
- Dep oidc-provider
- Dep nuxt
- Dep pinia nuxt
- Dep pino
- Dep pino-pretty
- Dep postgres
- Dep reka-ui
- Dep shadcn-nuxt
- Dep tailwind-merge
- Dep tailwindcss vite
- Dep tw-animate-css
- Dep unhead vue
- Dep uuid
- Dep vue-router
- Dep vue-sonner
- Dep vueuse core
- Dep vueuse nuxt
- useSso Composable
- Homepage URL Migration
- Admin Global Middleware
- Auth Middleware
- Index Page
- SSR Width Plugin
- Drizzle Config
- ESLint Config
- Nuxt Config
- CORS Middleware
- ESLint Config

## God Nodes (most connected - your core abstractions)
1. `cn()` - 69 edges
2. `db` - 69 edges
3. `getAuthUser()` - 38 edges
4. `users` - 29 edges
5. `writeAuditLog()` - 27 edges
6. `roles` - 17 edges
7. `AuditEvents` - 16 edges
8. `oidcClients` - 15 edges
9. `sites` - 14 edges
10. `createAuditLog()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `OIDC Authorization Code + PKCE` --semantically_similar_to--> `OIDC Authorization Code + PKCE Flow`  [INFERRED] [semantically similar]
  README.md → docs/architecture.md
- `openid-client Library` --implements--> `OIDC Authorization Code + PKCE`  [INFERRED]
  docs/oidc-client-node.md → README.md
- `Production SSO App Container` --semantically_similar_to--> `SSO App Service`  [INFERRED] [semantically similar]
  docker-compose.prod.yml → docker-compose.yml
- `robots.txt Disallow All` --conceptually_related_to--> `SSO Identity Provider (IdP)`  [INFERRED]
  public/robots.txt → README.md
- `Custom SsoProvider Socialite Provider` --implements--> `OIDC Authorization Code + PKCE`  [INFERRED]
  docs/oidc-client-laravel.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **3-step Nuxt module setup flow** — packages_nuxt_sso_client_readme_nuxt_config, packages_nuxt_sso_client_readme_ssoclient_options, packages_nuxt_sso_client_readme_resolve_user, packages_nuxt_sso_client_readme_usesso_composable, packages_nuxt_sso_client_readme_env_vars [EXTRACTED 1.00]
- **SSO authentication/session-check route flow** — packages_nuxt_sso_client_readme_route_login, packages_nuxt_sso_client_readme_route_callback, packages_nuxt_sso_client_readme_route_check_session, packages_nuxt_sso_client_readme_session_revoke_check [EXTRACTED 1.00]
- **OIDC Client Integration Guides** — docs_oidc_client_laravel_laravel_oidc_guide, docs_oidc_client_node_nodejs_oidc_guide, docs_laravel_6_integration_laravel6_oidc, docs_nuxt_4_integration_nuxt4_jwt_oidc, docs_nuxt_sso_client_nuxt_sso_client_package [INFERRED 0.85]
- **SSO MVP Stack Definition Across Prompts** — docs_prompt_implement_sso_prompt_implement_sso_mvp, docs_prompt_sso_agent_prompt_sso_agent_brief, docs_prompt_vscode_copilot_prompt_sso_copilot_mvp_prompt, readme_tech_stack, readme_oidc_provider_library [EXTRACTED 1.00]

## Communities (151 total, 63 thin omitted)

### Community 0 - "Admin User Access UI"
Cohesion: 0.03
Nodes (56): allUsers, availableClientSearch, availableUserSearch, bulkSiteFilter, bulkSites, bulkUnitFilter, bulkUnitFilterOptions, bulkUnits (+48 more)

### Community 1 - "OIDC Interaction Routes"
Cohesion: 0.05
Nodes (28): emit, open, props, emit, open, props, attrs, Icon (+20 more)

### Community 2 - "Admin Check Scripts"
Cohesion: 0.09
Nodes (8): updateUserSchema, createUserSchema, db, queryClient, accessGroupClients, accessGroups, accessGroupUsers, auditLogs

### Community 3 - "Dropdown Menu UI"
Cohesion: 0.05
Nodes (27): delegatedProps, emits, forwarded, props, props, delegatedProps, forwardedProps, props (+19 more)

### Community 4 - "OIDC Auth Endpoints"
Cohesion: 0.10
Nodes (21): getUserIdFromSession(), getHeader(), handleAuthorizationCodeGrant(), handleRefreshTokenGrant(), PROTECTED_PREFIXES, createAccessToken(), createAuthorizationCode(), createIDToken() (+13 more)

### Community 5 - "Select Component UI"
Cohesion: 0.08
Nodes (27): clients, clientToDelete, clientTypeOptions, closeModal(), copyToClipboard(), createClient(), createdClient, deleteClient() (+19 more)

### Community 6 - "Nuxt SSO Client Package"
Cohesion: 0.06
Nodes (32): h3, @nuxt/kit, ofetch, dependencies, h3, @nuxt/kit, ofetch, description (+24 more)

### Community 7 - "Admin Clients API"
Cohesion: 0.14
Nodes (12): updateDivisionSchema, createDivisionSchema, updateSiteSchema, createSiteSchema, updateUnitSchema, createUnitSchema, divisions, sites (+4 more)

### Community 8 - "Divisions Units API"
Cohesion: 0.07
Nodes (25): changePage(), closeModal(), currentPage, deleteUser(), deleting, deletingUser, editingUser, fetchUsers() (+17 more)

### Community 9 - "Admin Users Page"
Cohesion: 0.08
Nodes (26): closeModal(), currentUser, deleteDivision(), deleting, deletingDivision, divisions, editingDivision, errorMessage (+18 more)

### Community 10 - "Admin Divisions Page"
Cohesion: 0.08
Nodes (23): closeModal(), currentUser, deleteSite(), editingId, errorMessage, expandedDivisions, expandedSites, fetchSites() (+15 more)

### Community 11 - "Admin Sites Page"
Cohesion: 0.13
Nodes (8): oidcKv, fetchFromHris(), syncHrisUsers(), authenticateUser(), AuditEvents, createAuditLogger(), writeAuditLog(), logger

### Community 12 - "Admin Clients Page"
Cohesion: 0.09
Nodes (22): availablePermissions, closeModal(), createRole(), deleteRole(), editingRole, errorMessage, form, isCategoryFullySelected() (+14 more)

### Community 13 - "Admin Roles Page"
Cohesion: 0.10
Nodes (13): props, props, props, props, props, props, props, props (+5 more)

### Community 14 - "Root Package Metadata"
Cohesion: 0.08
Nodes (25): drizzle-kit, author, description, devDependencies, drizzle-kit, directories, doc, keywords (+17 more)

### Community 15 - "Admin Units Page"
Cohesion: 0.09
Nodes (21): closeModal(), currentUser, deleteUnit(), deleting, deletingUnit, divisionFilterItems, divisionOptions, divisions (+13 more)

### Community 16 - "Card UI Components"
Cohesion: 0.13
Nodes (11): props, props, props, props, props, delegatedProps, props, props (+3 more)

### Community 17 - "Table and Dialog UI"
Cohesion: 0.09
Nodes (16): closeRevokeModal(), confirmRevoke(), errorMessage, filteredSessions, getPlatform(), getPlatformIconPath(), loading, onlineUsers (+8 more)

### Community 18 - "Site Admin Scripts"
Cohesion: 0.16
Nodes (11): getHeader(), getSessionUserId(), createAdapter(), createOidcProvider(), createProviderConfig(), findAccount(), getOidcProvider(), appendSetCookie() (+3 more)

### Community 19 - "Admin Layout Shell"
Cohesion: 0.11
Nodes (18): accessList, accessToRevoke, clientItems, clients, closeGrantModal(), doRevokeAccess(), grantAccess(), grantForm (+10 more)

### Community 20 - "Legacy User Access UI"
Cohesion: 0.18
Nodes (7): SITE_ADMIN_PERMISSIONS, SITE_ADMIN_PERMISSIONS, PERMISSIONS, roles, userRoles, users, seedDatabase()

### Community 21 - "Admin Sessions Page"
Cohesion: 0.11
Nodes (15): clientId, codeChallenge, codeChallengeMethod, email, errorMsg, isLoading, isOIDCFlow, nonce (+7 more)

### Community 22 - "Sheet Component UI"
Cohesion: 0.11
Nodes (17): aliases, components, composables, lib, ui, utils, iconLibrary, registries (+9 more)

### Community 23 - "Login Page Flow"
Cohesion: 0.13
Nodes (8): props, delegatedProps, props, props, props, delegatedProps, props, props

### Community 24 - "Shadcn Components Config"
Cohesion: 0.16
Nodes (15): SSO environment variables (SSO_ISSUER, SSO_CLIENT_ID, SSO_CLIENT_SECRET, SSO_REDIRECT_URI, APP_URL, SSO_AUTO_PROVISION), GitHub Packages registry, .npmrc registry configuration, nuxt.config.js ssoClient setup, @mbx92/nuxt-sso-client (Nuxt module), OIDC Authorization Code + PKCE flow, .github/workflows/publish-nuxt-sso-client.yml, server/sso/resolve-user.js (resolveSsoUser) (+7 more)

### Community 25 - "Input Components"
Cohesion: 0.26
Nodes (9): base64Url(), createPkcePair(), failLoginRedirect(), getCallbackUri(), getSsoConfig(), getSsoSession(), sessionPassword(), successRedirectUrl() (+1 more)

### Community 26 - "Checkbox and Label UI"
Cohesion: 0.14
Nodes (9): emit, model, props, delegatedProps, emits, forwarded, props, delegatedProps (+1 more)

### Community 27 - "Admin Roles API"
Cohesion: 0.14
Nodes (12): currentUser, filteredMenuItems, isSuperAdmin, menuItems, pageTitle, route, secondaryItems, siteSettings (+4 more)

### Community 28 - "SSO Client Callbacks"
Cohesion: 0.18
Nodes (14): Node.js OIDC Client Guide, openid-client Library, Audit Log Retention Policy, JWT Signing Key Rotation, Operations Guide, Structured JSON Logging, Implement SSO MVP Prompt, Single Issuer Multi-Site Strategy (+6 more)

### Community 29 - "DB Schema Relations"
Cohesion: 0.25
Nodes (6): updateRoleSchema, createRoleSchema, canAccessSite(), getUserSiteId(), isSuperAdmin(), ROLES

### Community 30 - "Core Dependencies"
Cohesion: 0.17
Nodes (13): EnsureTokenIsValid Middleware, findOrCreateFromSSO Account Linking, Laravel 6 OIDC Integration, Laravel SSOController, @mbx92/nuxt-sso-client Package, resolveSsoUser Hook, useSso Composable, Laravel OIDC Client Guide (+5 more)

### Community 31 - "Switch Component UI"
Cohesion: 0.15
Nodes (12): accessGroupClientsRelations, accessGroupsRelations, accessGroupUsersRelations, auditLogsRelations, divisionsRelations, oidcClientsRelations, rolesRelations, sitesRelations (+4 more)

### Community 32 - "Legacy HRIS Import"
Cohesion: 0.22
Nodes (7): RATE_LIMIT_CONFIG, RATE_LIMITED_PATHS, rateLimitStore, createRequestLogger(), logRequest(), maskSensitive(), SENSITIVE_KEYS

### Community 34 - "Textarea Components"
Cohesion: 0.18
Nodes (6): props, props, delegatedProps, forwardedProps, props, props

### Community 35 - "Audit Logs Page"
Cohesion: 0.18
Nodes (11): argon2, better-sqlite3, @nuxt/scripts, dependencies, argon2, better-sqlite3, @nuxt/scripts, @tanstack/vue-table (+3 more)

### Community 36 - "OIDC Client Guides"
Cohesion: 0.20
Nodes (6): emits, modelValue, props, emit, Icon, props

### Community 37 - "JSConfig Paths"
Cohesion: 0.20
Nodes (7): delegatedProps, emits, forwarded, props, emit, model, props

### Community 38 - "Confirm Modal Button"
Cohesion: 0.27
Nodes (9): __dirname, main(), parseInsert(), root, SITE_MAP, slugCode(), sqlPath, SUPERADMIN_EMAIL (+1 more)

### Community 40 - "Alert Components"
Cohesion: 0.22
Nodes (6): emits, modelValue, props, emit, model, props

### Community 41 - "Dialog Content Overlay"
Cohesion: 0.22
Nodes (4): filter, filterOptions, loading, logs

### Community 42 - "Dropdown Menu Items"
Cohesion: 0.22
Nodes (8): compilerOptions, baseUrl, paths, exclude, .nuxt, dist, node_modules, .output

### Community 43 - "Sheet Content Panel"
Cohesion: 0.29
Nodes (5): mappedVariant, props, delegatedProps, props, badgeVariants

### Community 44 - "Tabs Component UI"
Cohesion: 0.29
Nodes (4): props, props, props, alertVariants

### Community 45 - "Popover Component UI"
Cohesion: 0.25
Nodes (6): delegatedProps, emits, forwarded, props, delegatedProps, props

### Community 46 - "Tooltip Component UI"
Cohesion: 0.25
Nodes (6): delegatedProps, emits, forwarded, props, delegatedProps, props

### Community 47 - "Avatar Component UI"
Cohesion: 0.25
Nodes (7): clientInitial, clientName, interactionUid, requestedScopes, route, scopeDescriptions, userEmail

### Community 48 - "OIDC Provider Setup"
Cohesion: 0.25
Nodes (8): SSO App Healthcheck /api/health, External postgres_default Network, Production SSO App Container, SSO App Service, SSO PostgreSQL Database Service, oidc_kv Persistence Adapter, PostgreSQL Database, oidc_kv MVP Adapter Choice

### Community 49 - "Docker Compose Stack"
Cohesion: 0.36
Nodes (8): SSO Security Brand Mark, Browser Tab Favicon Purpose, Circular Dark Background, Keyhole Mark, Lock Body Rectangle, Lock Shackle Arc, Near-Black and White Palette, Padlock Favicon Icon

### Community 50 - "Nuxt SSO Module Docs"
Cohesion: 0.33
Nodes (4): delegatedProps, props, delegatedProps, props

### Community 51 - "Publish Workflow CI"
Cohesion: 0.29
Nodes (6): emit, filtered, model, normalized, props, query

### Community 52 - "Password Reset Flow"
Cohesion: 0.33
Nodes (5): fetchStats(), recentLogs, stats, syncLoading, triggerHrisSync()

### Community 53 - "Access Denied Page"
Cohesion: 0.29
Nodes (7): addClientToGroup(), addUserToGroup(), clearSelectedClientToAdd(), clearSelectedUserToAdd(), doRemoveClientFromGroup(), doRemoveUserFromGroup(), viewGroupDetails()

### Community 54 - "Nuxt OIDC Integration"
Cohesion: 0.38
Nodes (7): App Icon / Favicon Purpose, Authentication and Security Symbolism, SSO Login Brand Mark, Circular Near-Black Badge, Keyhole Detail, Near-Black and White Monochrome Palette, Padlock Icon

### Community 55 - "TSConfig Paths"
Cohesion: 0.40
Nodes (5): clearAllCookies(), clientName, goBack(), route, router

### Community 56 - "Dialog Scroll Content"
Cohesion: 0.33
Nodes (6): OIDC Authorization Code + PKCE Flow, Opaque Access Tokens, Nuxt 4 JWT-Based OIDC Integration, Pinia Auth Store, PKCE Code Verifier and Challenge, useAuth Composable

### Community 57 - "USelect Wrapper"
Cohesion: 0.33
Nodes (5): compilerOptions, baseUrl, paths, files, references

### Community 58 - "Access Group Membership"
Cohesion: 0.40
Nodes (4): delegatedProps, emits, forwarded, props

### Community 59 - "Apps Launcher Page"
Cohesion: 0.40
Nodes (4): delegatedProps, emits, forwarded, props

### Community 60 - "MiniMax Design System"
Cohesion: 0.40
Nodes (4): emit, model, normalized, props

### Community 61 - "Access Groups Model"
Cohesion: 0.40
Nodes (4): envVars, routes, steps, troubleshooting

### Community 62 - "SSO System Architecture"
Cohesion: 0.40
Nodes (3): apps, loading, user

### Community 63 - "App Shell Sonner"
Cohesion: 0.40
Nodes (5): Black Pill Primary CTA, DM Sans Typography System, Documentation Three-Column Layout, MiniMax Design System, Product Color Encoding

### Community 64 - "App Logo Component"
Cohesion: 0.40
Nodes (5): Access Check Priority Chain, Access Groups, checkUserClientAccess, user_app_access Direct Grant, Admin UI

### Community 65 - "Error Modal Component"
Cohesion: 0.40
Nodes (5): HRIS API (Laravel), SSO Security Model, SSO System Architecture, No Password Sync Constraint, HRIS User Sync

### Community 68 - "Separator Component"
Cohesion: 0.50
Nodes (3): box, iconPx, props

### Community 69 - "Auth Global Middleware"
Cohesion: 0.50
Nodes (3): emits, forwarded, props

### Community 70 - "Admin Settings Page"
Cohesion: 0.50
Nodes (3): delegatedProps, forwardedProps, props

### Community 71 - "Resolve User Example"
Cohesion: 0.50
Nodes (3): delegatedProps, forwardedProps, props

### Community 72 - "Check Client Script"
Cohesion: 0.50
Nodes (3): emits, forwarded, props

### Community 73 - "Enable Access Control"
Cohesion: 0.50
Nodes (3): delegatedProps, forwardedProps, props

### Community 74 - "Grant User Access Script"
Cohesion: 0.50
Nodes (3): delegatedProps, forwardedProps, props

### Community 75 - "List User Access Script"
Cohesion: 0.50
Nodes (3): delegatedProps, forwardedProps, props

### Community 77 - "Show Users Script"
Cohesion: 0.50
Nodes (3): emits, forwarded, props

### Community 91 - "Apply Sites Migration"
Cohesion: 0.50
Nodes (3): __dirname, __filename, sql

### Community 92 - "Check Tables Script"
Cohesion: 0.67
Nodes (3): createGroup(), doDeleteGroup(), loadGroups()

## Knowledge Gaps
- **617 isolated node(s):** `props`, `box`, `iconPx`, `props`, `emit` (+612 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **63 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Admin Roles Page` to `OIDC Interaction Routes`, `Dropdown Menu UI`, `Card UI Components`, `Login Page Flow`, `Checkbox and Label UI`, `Textarea Components`, `OIDC Client Guides`, `JSConfig Paths`, `Alert Components`, `Sheet Content Panel`, `Tabs Component UI`, `Popover Component UI`, `Tooltip Component UI`, `Nuxt SSO Module Docs`, `Publish Workflow CI`, `Access Group Membership`, `Apps Launcher Page`, `MiniMax Design System`, `Dialog Description`, `Admin Settings Page`, `Resolve User Example`, `Enable Access Control`, `Grant User Access Script`, `List User Access Script`, `Set HRIS Passwords`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Audit Logs Page` to `Dep vueuse nuxt`, `useSso Composable`, `Homepage URL Migration`, `Admin Global Middleware`, `Auth Middleware`, `Index Page`, `SSR Width Plugin`, `Drizzle Config`, `ESLint Config`, `Nuxt Config`, `Root Package Metadata`, `Dep lucide-vue-next`, `Dep nuxt content`, `Dep nuxt eslint`, `Dep nuxt hints`, `Dep nuxt image`, `Dep nuxt test-utils`, `Dep oidc-provider`, `Dep nuxt`, `Dep pinia nuxt`, `Dep pino`, `Dep pino-pretty`, `Dep postgres`, `Dep reka-ui`, `Dep shadcn-nuxt`, `Dep tailwind-merge`, `Dep tailwindcss vite`, `Dep tw-animate-css`, `Dep unhead vue`, `Dep uuid`, `Dep vue-router`, `Dep vue-sonner`, `Dep vueuse core`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Why does `db` connect `Admin Check Scripts` to `Dialog Title Triggers`, `OIDC Auth Endpoints`, `Admin Clients API`, `Admin Sites Page`, `Site Admin Scripts`, `Legacy User Access UI`, `DB Schema Relations`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `props`, `box`, `iconPx` to the rest of the system?**
  _617 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin User Access UI` be split into smaller, more focused modules?**
  _Cohesion score 0.02564102564102564 - nodes in this community are weakly interconnected._
- **Should `OIDC Interaction Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.05121951219512195 - nodes in this community are weakly interconnected._
- **Should `Admin Check Scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.08846153846153847 - nodes in this community are weakly interconnected._