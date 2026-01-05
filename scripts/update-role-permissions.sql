-- Update superadmin role with all permissions
UPDATE roles 
SET 
  permissions = '[
    "dashboard.view",
    "sites.view", "sites.create", "sites.edit", "sites.delete",
    "divisions.view", "divisions.create", "divisions.edit", "divisions.delete",
    "units.view", "units.create", "units.edit", "units.delete",
    "users.view", "users.create", "users.edit", "users.delete",
    "clients.view", "clients.create", "clients.edit", "clients.delete",
    "roles.view", "roles.create", "roles.edit", "roles.delete",
    "user-access.view", "user-access.manage",
    "audit.view",
    "settings.view", "settings.edit"
  ]'::jsonb,
  is_system = true,
  description = 'Full system access - can manage sites, clients, users, roles, and all settings'
WHERE name = 'superadmin';

-- Update admin role with limited permissions
UPDATE roles 
SET 
  permissions = '[
    "dashboard.view",
    "users.view",
    "audit.view"
  ]'::jsonb,
  description = 'Administrative access - can view users and audit logs'
WHERE name = 'admin';

-- Update user role with basic permissions
UPDATE roles 
SET 
  permissions = '["dashboard.view"]'::jsonb,
  description = 'Regular user - basic SSO access'
WHERE name = 'user';

-- Show updated roles
SELECT name, is_system, permissions FROM roles;
