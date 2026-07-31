-- Only new changes not covered by 0003, 0004, 0005 migrations
-- Add site_id to oidc_clients (use DO block to handle IF NOT EXISTS)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'oidc_clients' AND column_name = 'site_id') THEN
        ALTER TABLE "oidc_clients" ADD COLUMN "site_id" uuid;
    END IF;
END $$;--> statement-breakpoint

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roles' AND column_name = 'permissions') THEN
        ALTER TABLE "roles" ADD COLUMN "permissions" jsonb DEFAULT '[]'::jsonb NOT NULL;
    END IF;
END $$;--> statement-breakpoint

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roles' AND column_name = 'site_id') THEN
        ALTER TABLE "roles" ADD COLUMN "site_id" uuid;
    END IF;
END $$;--> statement-breakpoint

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roles' AND column_name = 'is_system') THEN
        ALTER TABLE "roles" ADD COLUMN "is_system" boolean DEFAULT false NOT NULL;
    END IF;
END $$;--> statement-breakpoint

-- Add foreign keys (skip if already exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'oidc_clients_site_id_sites_id_fk') THEN
        ALTER TABLE "oidc_clients" ADD CONSTRAINT "oidc_clients_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'roles_site_id_sites_id_fk') THEN
        ALTER TABLE "roles" ADD CONSTRAINT "roles_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint

-- Add indexes (skip if already exists)
CREATE INDEX IF NOT EXISTS "oidc_clients_site_id_idx" ON "oidc_clients" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "roles_site_id_idx" ON "roles" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "roles_is_system_idx" ON "roles" USING btree ("is_system");