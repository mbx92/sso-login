import { pgTable, uuid, varchar, text, timestamp, jsonb, boolean, primaryKey, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ==================== USERS ====================
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: varchar('employee_id', { length: 100 }).unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active'), // active, disabled
  passwordHash: text('password_hash'),
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
  index('users_department_idx').on(table.department)
])

// ==================== ROLES ====================
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

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
  index('oidc_clients_is_active_idx').on(table.isActive)
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
export const usersRelations = relations(users, ({ many }) => ({
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
