-- Update admin user to superadmin
UPDATE users 
SET 
  role_name = 'superadmin',
  role_id = 'superadmin'
WHERE email = 'admin@example.com';

-- Check the result
SELECT id, email, name, role_name, role_id, unit_id 
FROM users 
WHERE email = 'admin@example.com';
