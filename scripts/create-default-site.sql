-- Create default site
INSERT INTO sites (id, code, name, description, is_active)
VALUES (
  gen_random_uuid(),
  'HQ',
  'Headquarters',
  'Default headquarters site',
  true
) ON CONFLICT DO NOTHING;

-- Show created site
SELECT id, code, name FROM sites;
