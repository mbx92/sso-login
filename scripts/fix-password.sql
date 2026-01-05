UPDATE users 
SET password_hash = '$argon2id$v=19$m=65536,t=3,p=4$GjRA4DLh6DrUeHMdzHqSqg$8RLOTxcDZm/Zc8PPGngl07aOEYX297vCpT7nQjQ2f20' 
WHERE email = 'admin@example.com';
