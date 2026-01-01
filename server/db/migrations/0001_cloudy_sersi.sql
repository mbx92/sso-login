CREATE TABLE "divisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "divisions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"division_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "units_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "user_app_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"granted_by" uuid,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "oidc_clients" ADD COLUMN "require_access_grant" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "unit_id" uuid;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_division_id_divisions_id_fk" FOREIGN KEY ("division_id") REFERENCES "public"."divisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_app_access" ADD CONSTRAINT "user_app_access_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_app_access" ADD CONSTRAINT "user_app_access_client_id_oidc_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oidc_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_app_access" ADD CONSTRAINT "user_app_access_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "divisions_code_idx" ON "divisions" USING btree ("code");--> statement-breakpoint
CREATE INDEX "divisions_is_active_idx" ON "divisions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "units_code_idx" ON "units" USING btree ("code");--> statement-breakpoint
CREATE INDEX "units_division_id_idx" ON "units" USING btree ("division_id");--> statement-breakpoint
CREATE INDEX "units_is_active_idx" ON "units" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "user_app_access_user_id_idx" ON "user_app_access" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_app_access_client_id_idx" ON "user_app_access" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "user_app_access_is_active_idx" ON "user_app_access" USING btree ("is_active");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "users_unit_id_idx" ON "users" USING btree ("unit_id");