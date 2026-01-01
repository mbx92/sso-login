import { pgTable, uuid, varchar, text, timestamp, jsonb, boolean, primaryKey, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ==================== SITES ====================
export const sites = pgTable('sites', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  address: text('address'),
  useDivisions: boolean('use_divisions').notNull().default(false),
  useUnits: boolean('use_units').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => [
  index('sites_code_idx').on(table.code),
  index('sites_is_active_idx').on(table.isActive)
])

// ==================== DIVISIONS ====================
export const divisions = pgTable('divisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => [
  index('divisions_code_idx').on(table.code),
  index('divisions_site_id_idx').on(table.siteId),
  index('divisions_is_active_idx').on(table.isActive)
])

// ==================== UNITS ====================
export const units = pgTable('units', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  divisionId: uuid('division_id').notNull().references(() => divisions.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => [
  index('units_code_idx').on(table.code),
  index('units_site_id_idx').on(table.siteId),
  index('units_division_id_idx').on(table.divisionId),
  index('units_is_active_idx').on(table.isActive)
])

// ==================== USERS ====================
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: varchar('employee_id', { length: 100 }).unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active'), // active, disabled
  passwordHash: text('password_hash'),
  unitId: uuid('unit_id').references(() => units.id, { onDelete: 'set null' }),
  department: varchar('department', { length: 255 }),
  position: varchar('position', { length: 255 }),
  avatarUrl: text('avatar_url'),
  roleId: varchar('role_id', { length: 50 }),
  roleName: varchar('role_name', { length: 100 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => [
  index('users_email_idx').on(table.email),
  index('users_employee_id_idx').on(table.employeeId),
  index('users_status_idx').on(table.status),
  index('users_department_idx').on(table.department),
  index('users_unit_id_idx').on(table.unitId)
])

// ==================== PERMISSIONS LIST ====================
// Available permissions that can be assigned to roles
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
  
  // Sites
  SITES_VIEW: 'sites.view',
  SITES_CREATE: 'sites.create',
  SITES_EDIT: 'sites.edit',
  SITES_DELETE: 'sites.delete',
  
  // Divisions
  DIVISIONS_VIEW: 'divisions.view',
  DIVISIONS_CREATE: 'divisions.create',
  DIVISIONS_EDIT: 'divisions.edit',
  DIVISIONS_DELETE: 'divisions.delete',
  
  // Units
  UNITS_VIEW: 'units.view',
  UNITS_CREATE: 'units.create',
  UNITS_EDIT: 'units.edit',
  UNITS_DELETE: 'units.delete',
  
  // Users
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  
  // OIDC Clients
  CLIENTS_VIEW: 'clients.view',
  CLIENTS_CREATE: 'clients.create',
  CLIENTS_EDIT: 'clients.edit',
  CLIENTS_DELETE: 'clients.delete',
  
  // Roles
  ROLES_VIEW: 'roles.view',
  ROLES_CREATE: 'roles.create',
  ROLES_EDIT: 'roles.edit',
  ROLES_DELETE: 'roles.delete',
  
  // User Access
  USER_ACCESS_VIEW: 'user-access.view',
  USER_ACCESS_MANAGE: 'user-access.manage',
  
  // Audit Logs
  AUDIT_VIEW: 'audit.view',
  
  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit'
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

// ==================== ROLES ====================
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  permissions: jsonb('permissions').notNull().$type<string[]>().default([]),
  siteId: uuid('site_id').references(() => sites.id, { onDelete: 'cascade' }), // null = global role
  isSystem: boolean('is_system').notNull().default(false), // system roles cannot be deleted
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => [
  index('roles_site_id_idx').on(table.siteId),
  index('roles_is_system_idx').on(table.isSystem)
])

// ==================== USER ROLES ====================
export const userRoles = pgTable('user_roles', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow()
}, (table) => [
  primaryKey({ columns: [table.userId, table.roleId] })
])

// ==================== OIDC CLIENTS ====================
export const oidcClients = pgTable('oidc_clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: varchar('client_id', { length: 255 }).notNull().unique(),
  clientSecretHash: text('client_secret_hash'), // nullable for public clients
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  siteId: uuid('site_id').references(() => sites.id, { onDelete: 'set null' }), // null = global client
  redirectUris: jsonb('redirect_uris').notNull().$type<string[]>().default([]),
  postLogoutRedirectUris: jsonb('post_logout_redirect_uris').$type<string[]>().default([]),
  grantTypes: jsonb('grant_types').notNull().$type<string[]>().default(['authorization_code']),
  responseTypes: jsonb('response_types').notNull().$type<string[]>().default(['code']),
  scopes: jsonb('scopes').notNull().$type<string[]>().default(['openid', 'profile', 'email']),
  tokenEndpointAuthMethod: varchar('token_endpoint_auth_method', { length: 50 }).notNull().default('client_secret_basic'),
  isFirstParty: boolean('is_first_party').notNull().default(false), // auto-approve consent
  requireAccessGrant: boolean('require_access_grant').notNull().default(false), // if true, user must have access grant
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => [
  index('oidc_clients_client_id_idx').on(table.clientId),
  index('oidc_clients_is_active_idx').on(table.isActive),
  index('oidc_clients_site_id_idx').on(table.siteId)
])

// ==================== AUDIT LOGS ====================
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  at: timestamp('at').notNull().defaultNow(),
  actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
  actorType: varchar('actor_type', { length: 20 }).notNull().default('user'), // user, system
  action: varchar('action', { length: 100 }).notNull(),
  targetType: varchar('target_type', { length: 100 }),
  targetId: varchar('target_id', { length: 255 }),
  ip: varchar('ip', { length: 45 }),
  userAgent: text('user_agent'),
  requestId: varchar('request_id', { length: 100 }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({})
}, (table) => [
  index('audit_logs_at_idx').on(table.at),
  index('audit_logs_action_idx').on(table.action),
  index('audit_logs_actor_user_id_idx').on(table.actorUserId),
  index('audit_logs_target_type_idx').on(table.targetType),
  index('audit_logs_request_id_idx').on(table.requestId)
])

// ==================== USER APP ACCESS (Access Control) ====================
export const userAppAccess = pgTable('user_app_access', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id').notNull().references(() => oidcClients.id, { onDelete: 'cascade' }),
  grantedBy: uuid('granted_by').references(() => users.id, { onDelete: 'set null' }),
  grantedAt: timestamp('granted_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'), // null = never expires
  isActive: boolean('is_active').notNull().default(true),
  notes: text('notes')
}, (table) => [
  index('user_app_access_user_id_idx').on(table.userId),
  index('user_app_access_client_id_idx').on(table.clientId),
  index('user_app_access_is_active_idx').on(table.isActive)
])

// ==================== OIDC KV (Generic persistence for oidc-provider) ====================
export const oidcKv = pgTable('oidc_kv', {
  id: uuid('id').primaryKey().defaultRandom(),
  model: varchar('model', { length: 50 }).notNull(), // Grant, Session, AccessToken, etc.
  key: varchar('key', { length: 255 }).notNull(),
  payload: jsonb('payload').notNull().$type<Record<string, unknown>>(),
  expiresAt: timestamp('expires_at'),
  userCode: varchar('user_code', { length: 255 }), // for device flow
  uid: varchar('uid', { length: 255 }), // for grants
  grantId: varchar('grant_id', { length: 255 }) // for token linking
}, (table) => [
  index('oidc_kv_model_key_idx').on(table.model, table.key),
  index('oidc_kv_expires_at_idx').on(table.expiresAt),
  index('oidc_kv_user_code_idx').on(table.userCode),
  index('oidc_kv_uid_idx').on(table.uid),
  index('oidc_kv_grant_id_idx').on(table.grantId)
])

// ==================== RELATIONS ====================
export const sitesRelations = relations(sites, ({ many }) => ({
  divisions: many(divisions),
  units: many(units)
}))

export const divisionsRelations = relations(divisions, ({ one, many }) => ({
  site: one(sites, {
    fields: [divisions.siteId],
    references: [sites.id]
  }),
  units: many(units)
}))

export const unitsRelations = relations(units, ({ one, many }) => ({
  site: one(sites, {
    fields: [units.siteId],
    references: [sites.id]
  }),
  division: one(divisions, {
    fields: [units.divisionId],
    references: [divisions.id]
  }),
  users: many(users)
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  unit: one(units, {
    fields: [users.unitId],
    references: [units.id]
  }),
  userRoles: many(userRoles),
  auditLogs: many(auditLogs),
  appAccess: many(userAppAccess)
}))

export const oidcClientsRelations = relations(oidcClients, ({ many }) => ({
  userAccess: many(userAppAccess)
}))

export const userAppAccessRelations = relations(userAppAccess, ({ one }) => ({
  user: one(users, {
    fields: [userAppAccess.userId],
    references: [users.id]
  }),
  client: one(oidcClients, {
    fields: [userAppAccess.clientId],
    references: [oidcClients.id]
  }),
  grantedByUser: one(users, {
    fields: [userAppAccess.grantedBy],
    references: [users.id]
  })
}))

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles)
}))

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id]
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id]
  })
}))

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [auditLogs.actorUserId],
    references: [users.id]
  })
}))

// ==================== TYPE EXPORTS ====================
export type Site = typeof sites.$inferSelect
export type NewSite = typeof sites.$inferInsert
export type Division = typeof divisions.$inferSelect
export type NewDivision = typeof divisions.$inferInsert
export type Unit = typeof units.$inferSelect
export type NewUnit = typeof units.$inferInsert
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Role = typeof roles.$inferSelect
export type NewRole = typeof roles.$inferInsert
export type UserRole = typeof userRoles.$inferSelect
export type NewUserRole = typeof userRoles.$inferInsert
export type OidcClient = typeof oidcClients.$inferSelect
export type NewOidcClient = typeof oidcClients.$inferInsert
export type AuditLog = typeof auditLogs.$inferSelect
export type NewAuditLog = typeof auditLogs.$inferInsert
export type OidcKvEntry = typeof oidcKv.$inferSelect
export type NewOidcKvEntry = typeof oidcKv.$inferInsert
export type UserAppAccess = typeof userAppAccess.$inferSelect
export type NewUserAppAccess = typeof userAppAccess.$inferInsert
