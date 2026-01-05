-- Assign superadmin role to admin@example.com 
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'admin@example.com' AND r.name = 'superadmin'
ON CONFLICT DO NOTHING;

-- Create new user it@baliroyalhospital.co.id with password Admin@123
-- Password hash for 'Admin@123': $argon2id$v=19$m=65536,t=3,p=4$GjRA4DLh6DrUeHMdzHqSqg$8RLOTxcDZm/Zc8PPGngl07aOEYX297vCpT7nQjQ2f20
INSERT INTO users (id, email, name, status, password_hash)
VALUES (
  gen_random_uuid(),
  'it@baliroyalhospital.co.id',
  'IT Administrator',
  'active',
  '$argon2id$v=19$m=65536,t=3,p=4$GjRA4DLh6DrUeHMdzHqSqg$8RLOTxcDZm/Zc8PPGngl07aOEYX297vCpT7nQjQ2f20'
) ON CONFLICT (email) DO NOTHING;

-- Assign superadmin role to it@baliroyalhospital.co.id
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'it@baliroyalhospital.co.id' AND r.name = 'superadmin'
ON CONFLICT DO NOTHING;

-- Verify
SELECT u.email, r.name as role_name 
FROM users u 
LEFT JOIN user_roles ur ON u.id = ur.user_id 
LEFT JOIN roles r ON ur.role_id = r.id;
