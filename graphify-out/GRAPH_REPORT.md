# Graph Report - .  (2026-08-03)

## Corpus Check
- 304 files · ~121,539 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1284 nodes · 1933 edges · 141 communities (81 shown, 60 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.83)
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
- Bulk Client Selector
- Bulk User Selector
- Dep bcryptjs
- Dep better-sqlite3
- Dep class-variance-authority
- Dep clsx
- Dep cookie-parser
- Dep drizzle-orm
- Dep eslint
- Dep jose
- Dep lucide vue
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
- Homepage URL Migration
- SSO Tech Stack

## God Nodes (most connected - your core abstractions)
1. `db` - 75 edges
2. `cn()` - 70 edges
3. `getAuthUser()` - 39 edges
4. `users` - 33 edges
5. `writeAuditLog()` - 27 edges
6. `roles` - 18 edges
7. `oidcClients` - 16 edges
8. `AuditEvents` - 16 edges
9. `isSuperAdmin()` - 15 edges
10. `sites` - 14 edges

## Surprising Connections (you probably didn't know these)
- `OIDC Authorization Code + PKCE` --semantically_similar_to--> `OIDC Authorization Code + PKCE Flow`  [INFERRED] [semantically similar]
  README.md → docs/architecture.md
- `OIDC vs SAML Protocol Choice` --rationale_for--> `OIDC Authorization Code + PKCE`  [INFERRED]
  docs/prompt/SSO_AGENT_PROMPT.md → README.md
- `Production SSO App Container` --semantically_similar_to--> `SSO App Service`  [INFERRED] [semantically similar]
  docker-compose.prod.yml → docker-compose.yml
- `robots.txt Disallow All` --conceptually_related_to--> `SSO Identity Provider (IdP)`  [INFERRED]
  public/robots.txt → README.md
- `Custom SsoProvider Socialite Provider` --implements--> `OIDC Authorization Code + PKCE`  [INFERRED]
  docs/oidc-client-laravel.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **OIDC Client Integration Guides** — docs_oidc_client_laravel_laravel_oidc_guide, docs_oidc_client_node_nodejs_oidc_guide, docs_laravel_6_integration_laravel6_oidc, docs_nuxt_4_integration_nuxt4_jwt_oidc, docs_nuxt_sso_client_nuxt_sso_client_package [INFERRED 0.85]
- **SSO MVP Stack Definition Across Prompts** — docs_prompt_implement_sso_prompt_implement_sso_mvp, docs_prompt_sso_agent_prompt_sso_agent_brief, docs_prompt_vscode_copilot_prompt_sso_copilot_mvp_prompt, readme_tech_stack, readme_oidc_provider_library [EXTRACTED 1.00]
- **nuxt-sso-client Publish Pipeline** — packages_nuxt_sso_client_readme_nuxt_sso_client, _github_workflows_publish_nuxt_sso_client_publish_workflow, _github_workflows_publish_nuxt_sso_client_github_packages, docs_nuxt_sso_client_nuxt_sso_client_package [EXTRACTED 1.00]

## Communities (141 total, 60 thin omitted)

### Community 0 - "Admin User Access UI"
Cohesion: 0.03
Nodes (48): allUsers, availableClientSearch, availableUserSearch, bulkUserItems, bulkUserSearchTerm, bulkUserSearchTermDebounced, chosenClientSearch, chosenUserSearch (+40 more)

### Community 1 - "OIDC Interaction Routes"
Cohesion: 0.06
Nodes (21): getHeader(), getSessionUserId(), RATE_LIMIT_CONFIG, RATE_LIMITED_PATHS, rateLimitStore, createAdapter(), PostgresAdapter, authenticateUser() (+13 more)

### Community 2 - "Admin Check Scripts"
Cohesion: 0.07
Nodes (9): updateUserSchema, createUserSchema, db, queryClient, accessGroupClients, accessGroups, accessGroupUsers, auditLogs (+1 more)

### Community 3 - "Dropdown Menu UI"
Cohesion: 0.05
Nodes (31): emits, forwarded, props, delegatedProps, emits, forwarded, props, delegatedProps (+23 more)

### Community 4 - "OIDC Auth Endpoints"
Cohesion: 0.10
Nodes (21): getUserIdFromSession(), getHeader(), handleAuthorizationCodeGrant(), handleRefreshTokenGrant(), PROTECTED_PREFIXES, createAccessToken(), createAuthorizationCode(), createIDToken() (+13 more)

### Community 5 - "Select Component UI"
Cohesion: 0.05
Nodes (25): emits, forwarded, props, delegatedProps, emits, forwarded, props, props (+17 more)

### Community 6 - "Nuxt SSO Client Package"
Cohesion: 0.06
Nodes (33): h3, @nuxt/kit, ofetch, dependencies, h3, @nuxt/kit, ofetch, description (+25 more)

### Community 7 - "Admin Clients API"
Cohesion: 0.11
Nodes (8): oidcClients, oidcKv, userAppAccess, fetchFromHris(), syncHrisUsers(), AuditEvents, createAuditLogger(), writeAuditLog()

### Community 8 - "Divisions Units API"
Cohesion: 0.14
Nodes (12): updateDivisionSchema, createDivisionSchema, updateSiteSchema, createSiteSchema, updateUnitSchema, createUnitSchema, divisions, sites (+4 more)

### Community 9 - "Admin Users Page"
Cohesion: 0.07
Nodes (25): changePage(), closeModal(), currentPage, deleteUser(), deleting, deletingUser, editingUser, fetchUsers() (+17 more)

### Community 10 - "Admin Divisions Page"
Cohesion: 0.08
Nodes (26): closeModal(), currentUser, deleteDivision(), deleting, deletingDivision, divisions, editingDivision, errorMessage (+18 more)

### Community 11 - "Admin Sites Page"
Cohesion: 0.08
Nodes (23): closeModal(), currentUser, deleteSite(), editingId, errorMessage, expandedDivisions, expandedSites, fetchSites() (+15 more)

### Community 12 - "Admin Clients Page"
Cohesion: 0.10
Nodes (24): clients, clientToDelete, clientTypeOptions, closeModal(), copyToClipboard(), createClient(), createdClient, deleteClient() (+16 more)

### Community 13 - "Admin Roles Page"
Cohesion: 0.09
Nodes (22): availablePermissions, closeModal(), createRole(), deleteRole(), editingRole, errorMessage, form, isCategoryFullySelected() (+14 more)

### Community 14 - "Root Package Metadata"
Cohesion: 0.08
Nodes (25): drizzle-kit, author, description, devDependencies, drizzle-kit, directories, doc, keywords (+17 more)

### Community 15 - "Admin Units Page"
Cohesion: 0.09
Nodes (21): closeModal(), currentUser, deleteUnit(), deleting, deletingUnit, divisionFilterItems, divisionOptions, divisions (+13 more)

### Community 16 - "Card UI Components"
Cohesion: 0.11
Nodes (11): props, props, props, props, props, props, props, props (+3 more)

### Community 17 - "Table and Dialog UI"
Cohesion: 0.13
Nodes (12): props, props, props, props, props, delegatedProps, props, props (+4 more)

### Community 18 - "Site Admin Scripts"
Cohesion: 0.17
Nodes (7): SITE_ADMIN_PERMISSIONS, SITE_ADMIN_PERMISSIONS, PERMISSIONS, roles, userRoles, users, seedDatabase()

### Community 19 - "Admin Layout Shell"
Cohesion: 0.10
Nodes (16): delegatedProps, props, delegatedProps, props, currentUser, filteredMenuItems, isSuperAdmin, menuItems (+8 more)

### Community 20 - "Legacy User Access UI"
Cohesion: 0.11
Nodes (18): accessList, accessToRevoke, clientItems, clients, closeGrantModal(), doRevokeAccess(), grantAccess(), grantForm (+10 more)

### Community 21 - "Admin Sessions Page"
Cohesion: 0.11
Nodes (13): closeRevokeModal(), confirmRevoke(), errorMessage, filteredSessions, loading, onlineUsers, revokingId, sessions (+5 more)

### Community 22 - "Sheet Component UI"
Cohesion: 0.11
Nodes (11): emits, forwarded, props, props, delegatedProps, props, props, props (+3 more)

### Community 23 - "Login Page Flow"
Cohesion: 0.11
Nodes (15): clientId, codeChallenge, codeChallengeMethod, email, errorMsg, isLoading, isOIDCFlow, nonce (+7 more)

### Community 24 - "Shadcn Components Config"
Cohesion: 0.11
Nodes (17): aliases, components, composables, lib, ui, utils, iconLibrary, registries (+9 more)

### Community 25 - "Input Components"
Cohesion: 0.12
Nodes (12): emits, modelValue, props, emit, Icon, props, emit, filtered (+4 more)

### Community 26 - "Checkbox and Label UI"
Cohesion: 0.14
Nodes (9): emit, model, props, delegatedProps, emits, forwarded, props, delegatedProps (+1 more)

### Community 27 - "Admin Roles API"
Cohesion: 0.25
Nodes (6): updateRoleSchema, createRoleSchema, canAccessSite(), getUserSiteId(), isSuperAdmin(), ROLES

### Community 28 - "SSO Client Callbacks"
Cohesion: 0.27
Nodes (6): base64Url(), createPkcePair(), failLoginRedirect(), getCallbackUri(), getSsoConfig(), successRedirectUrl()

### Community 29 - "DB Schema Relations"
Cohesion: 0.15
Nodes (12): accessGroupClientsRelations, accessGroupsRelations, accessGroupUsersRelations, auditLogsRelations, divisionsRelations, oidcClientsRelations, rolesRelations, sitesRelations (+4 more)

### Community 30 - "Core Dependencies"
Cohesion: 0.18
Nodes (11): argon2, express-rate-limit, @nuxt/scripts, dependencies, argon2, express-rate-limit, @nuxt/scripts, @tanstack/vue-table (+3 more)

### Community 31 - "Switch Component UI"
Cohesion: 0.20
Nodes (7): delegatedProps, emits, forwarded, props, emit, model, props

### Community 32 - "Legacy HRIS Import"
Cohesion: 0.27
Nodes (9): __dirname, main(), parseInsert(), root, SITE_MAP, slugCode(), sqlPath, SUPERADMIN_EMAIL (+1 more)

### Community 33 - "Dialog Title Triggers"
Cohesion: 0.22
Nodes (5): props, delegatedProps, forwardedProps, props, props

### Community 34 - "Textarea Components"
Cohesion: 0.22
Nodes (6): emits, modelValue, props, emit, model, props

### Community 35 - "Audit Logs Page"
Cohesion: 0.22
Nodes (4): filter, filterOptions, loading, logs

### Community 36 - "OIDC Client Guides"
Cohesion: 0.28
Nodes (9): Laravel OIDC Client Guide, Custom SsoProvider Socialite Provider, Node.js OIDC Client Guide, openid-client Library, pnpm Workspace allowBuilds, robots.txt Disallow All, Argon2id Password Hashing, OIDC Authorization Code + PKCE (+1 more)

### Community 37 - "JSConfig Paths"
Cohesion: 0.22
Nodes (8): compilerOptions, baseUrl, paths, exclude, .nuxt, dist, node_modules, .output

### Community 38 - "Confirm Modal Button"
Cohesion: 0.29
Nodes (5): emit, open, props, props, buttonVariants

### Community 39 - "Badge Components"
Cohesion: 0.29
Nodes (5): mappedVariant, props, delegatedProps, props, badgeVariants

### Community 40 - "Alert Components"
Cohesion: 0.29
Nodes (4): props, props, props, alertVariants

### Community 41 - "Dialog Content Overlay"
Cohesion: 0.25
Nodes (6): delegatedProps, emits, forwarded, props, delegatedProps, props

### Community 42 - "Dropdown Menu Items"
Cohesion: 0.21
Nodes (6): delegatedProps, forwardedProps, props, delegatedProps, forwardedProps, props

### Community 43 - "Sheet Content Panel"
Cohesion: 0.25
Nodes (6): delegatedProps, emits, forwarded, props, delegatedProps, props

### Community 44 - "Tabs Component UI"
Cohesion: 0.25
Nodes (7): clientInitial, clientName, interactionUid, requestedScopes, route, scopeDescriptions, userEmail

### Community 45 - "Popover Component UI"
Cohesion: 0.25
Nodes (8): SSO App Healthcheck /api/health, External postgres_default Network, Production SSO App Container, SSO App Service, SSO PostgreSQL Database Service, oidc_kv Persistence Adapter, PostgreSQL Database, oidc_kv MVP Adapter Choice

### Community 46 - "Tooltip Component UI"
Cohesion: 0.25
Nodes (8): EnsureTokenIsValid Middleware, findOrCreateFromSSO Account Linking, Laravel 6 OIDC Integration, Laravel SSOController, resolveSsoUser Hook, Existing App SSO Integration Strategies, OIDC vs SAML Protocol Choice, SSO Agent Architecture Brief

### Community 47 - "Avatar Component UI"
Cohesion: 0.29
Nodes (8): Audit Log Retention Policy, JWT Signing Key Rotation, Operations Guide, Structured JSON Logging, Implement SSO MVP Prompt, Single Issuer Multi-Site Strategy, VS Code Copilot SSO MVP Prompt, oidc-provider Library

### Community 48 - "OIDC Provider Setup"
Cohesion: 0.36
Nodes (8): SSO Security Brand Mark, Browser Tab Favicon Purpose, Circular Dark Background, Keyhole Mark, Lock Body Rectangle, Lock Shackle Arc, Near-Black and White Palette, Padlock Favicon Icon

### Community 49 - "Docker Compose Stack"
Cohesion: 0.29
Nodes (7): GitHub Packages Registry, Publish @mbx92/nuxt-sso-client Workflow, @mbx92/nuxt-sso-client Package, useSso Composable, @mbx92/nuxt-sso-client Module, /api/auth/sso/callback Route, /api/auth/sso/login Route

### Community 50 - "Nuxt SSO Module Docs"
Cohesion: 0.29
Nodes (5): attrs, Icon, mappedSize, mappedVariant, props

### Community 51 - "Publish Workflow CI"
Cohesion: 0.33
Nodes (5): fetchStats(), recentLogs, stats, syncLoading, triggerHrisSync()

### Community 52 - "Password Reset Flow"
Cohesion: 0.38
Nodes (7): App Icon / Favicon Purpose, Authentication and Security Symbolism, SSO Login Brand Mark, Circular Near-Black Badge, Keyhole Detail, Near-Black and White Monochrome Palette, Padlock Icon

### Community 53 - "Access Denied Page"
Cohesion: 0.40
Nodes (5): clearAllCookies(), clientName, goBack(), route, router

### Community 54 - "Nuxt OIDC Integration"
Cohesion: 0.33
Nodes (6): OIDC Authorization Code + PKCE Flow, Opaque Access Tokens, Nuxt 4 JWT-Based OIDC Integration, Pinia Auth Store, PKCE Code Verifier and Challenge, useAuth Composable

### Community 55 - "TSConfig Paths"
Cohesion: 0.33
Nodes (5): compilerOptions, baseUrl, paths, files, references

### Community 56 - "Dialog Scroll Content"
Cohesion: 0.40
Nodes (4): delegatedProps, emits, forwarded, props

### Community 57 - "USelect Wrapper"
Cohesion: 0.40
Nodes (4): emit, model, normalized, props

### Community 58 - "Access Group Membership"
Cohesion: 0.40
Nodes (5): addClientToGroup(), addUserToGroup(), doRemoveClientFromGroup(), doRemoveUserFromGroup(), viewGroupDetails()

### Community 59 - "Apps Launcher Page"
Cohesion: 0.40
Nodes (3): apps, loading, user

### Community 60 - "MiniMax Design System"
Cohesion: 0.40
Nodes (5): Black Pill Primary CTA, DM Sans Typography System, Documentation Three-Column Layout, MiniMax Design System, Product Color Encoding

### Community 61 - "Access Groups Model"
Cohesion: 0.40
Nodes (5): Access Check Priority Chain, Access Groups, checkUserClientAccess, user_app_access Direct Grant, Admin UI

### Community 62 - "SSO System Architecture"
Cohesion: 0.40
Nodes (5): HRIS API (Laravel), SSO Security Model, SSO System Architecture, No Password Sync Constraint, HRIS User Sync

### Community 64 - "App Logo Component"
Cohesion: 0.50
Nodes (3): box, iconPx, props

### Community 65 - "Error Modal Component"
Cohesion: 0.50
Nodes (3): emit, open, props

### Community 66 - "Dialog Root"
Cohesion: 0.50
Nodes (3): emits, forwarded, props

### Community 67 - "Dialog Description"
Cohesion: 0.50
Nodes (3): delegatedProps, forwardedProps, props

### Community 82 - "Migration 0003 Runner"
Cohesion: 0.50
Nodes (3): __dirname, __filename, sql

### Community 84 - "Access Group CRUD"
Cohesion: 0.67
Nodes (3): createGroup(), doDeleteGroup(), loadGroups()

## Knowledge Gaps
- **602 isolated node(s):** `props`, `box`, `iconPx`, `props`, `emit` (+597 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **60 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Table and Dialog UI` to `Dropdown Menu UI`, `Select Component UI`, `Card UI Components`, `Admin Layout Shell`, `Sheet Component UI`, `Input Components`, `Checkbox and Label UI`, `Switch Component UI`, `Dialog Title Triggers`, `Textarea Components`, `Confirm Modal Button`, `Badge Components`, `Alert Components`, `Dialog Content Overlay`, `Dropdown Menu Items`, `Sheet Content Panel`, `Nuxt SSO Module Docs`, `Dialog Scroll Content`, `USelect Wrapper`, `App Shell Sonner`, `Dialog Description`, `Separator Component`, `Skeleton Component`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Core Dependencies` to `Dep vueuse nuxt`, `Root Package Metadata`, `Dep bcryptjs`, `Dep better-sqlite3`, `Dep class-variance-authority`, `Dep clsx`, `Dep cookie-parser`, `Dep drizzle-orm`, `Dep eslint`, `Dep jose`, `Dep lucide vue`, `Dep lucide-vue-next`, `Dep nuxt content`, `Dep nuxt eslint`, `Dep nuxt hints`, `Dep nuxt image`, `Dep nuxt test-utils`, `Dep oidc-provider`, `Dep nuxt`, `Dep pinia nuxt`, `Dep pino`, `Dep pino-pretty`, `Dep postgres`, `Dep reka-ui`, `Dep shadcn-nuxt`, `Dep tailwind-merge`, `Dep tailwindcss vite`, `Dep tw-animate-css`, `Dep unhead vue`, `Dep uuid`, `Dep vue-router`, `Dep vue-sonner`, `Dep vueuse core`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Why does `db` connect `Admin Check Scripts` to `OIDC Interaction Routes`, `OIDC Auth Endpoints`, `Admin Clients API`, `Divisions Units API`, `Site Admin Scripts`, `Admin Roles API`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `props`, `box`, `iconPx` to the rest of the system?**
  _602 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin User Access UI` be split into smaller, more focused modules?**
  _Cohesion score 0.0273972602739726 - nodes in this community are weakly interconnected._
- **Should `OIDC Interaction Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.06448979591836734 - nodes in this community are weakly interconnected._
- **Should `Admin Check Scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.07400555041628122 - nodes in this community are weakly interconnected._