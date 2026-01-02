-- Create access_groups table
CREATE TABLE "access_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"site_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create access_group_users table
CREATE TABLE "access_group_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"added_by" uuid,
	"added_at" timestamp DEFAULT now() NOT NULL
);

-- Create access_group_clients table
CREATE TABLE "access_group_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"added_by" uuid,
	"added_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign keys for access_groups
ALTER TABLE "access_groups" ADD CONSTRAINT "access_groups_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "access_groups" ADD CONSTRAINT "access_groups_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;

-- Add foreign keys for access_group_users
ALTER TABLE "access_group_users" ADD CONSTRAINT "access_group_users_group_id_access_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."access_groups"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "access_group_users" ADD CONSTRAINT "access_group_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "access_group_users" ADD CONSTRAINT "access_group_users_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;

-- Add foreign keys for access_group_clients
ALTER TABLE "access_group_clients" ADD CONSTRAINT "access_group_clients_group_id_access_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."access_groups"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "access_group_clients" ADD CONSTRAINT "access_group_clients_client_id_oidc_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oidc_clients"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "access_group_clients" ADD CONSTRAINT "access_group_clients_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;

-- Create indexes
CREATE INDEX "access_groups_site_id_idx" ON "access_groups" USING btree ("site_id");
CREATE INDEX "access_groups_is_active_idx" ON "access_groups" USING btree ("is_active");
CREATE INDEX "access_group_users_group_id_idx" ON "access_group_users" USING btree ("group_id");
CREATE INDEX "access_group_users_user_id_idx" ON "access_group_users" USING btree ("user_id");
CREATE INDEX "access_group_clients_group_id_idx" ON "access_group_clients" USING btree ("group_id");
CREATE INDEX "access_group_clients_client_id_idx" ON "access_group_clients" USING btree ("client_id");
