-- Script: Update User to Superadmin Role
-- Description: Set user role to superadmin
-- Usage: Run this script after initial setup or when creating new superadmin users

-- Update admin user to superadmin
UPDATE users 
SET role_id = 'superadmin', 
    role_name = 'Super Administrator',
    updated_at = NOW()
WHERE email = 'admin@example.com';

-- Update IT admin to superadmin (if exists)
UPDATE users 
SET role_id = 'superadmin', 
    role_name = 'Super Administrator',
    updated_at = NOW()
WHERE email = 'it@baliroyalhospital.co.id';

-- Display updated users
SELECT id, email, name, role_id, role_name 
FROM users 
WHERE role_id = 'superadmin'
ORDER BY email;
