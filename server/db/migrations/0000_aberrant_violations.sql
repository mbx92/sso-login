CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"at" timestamp DEFAULT now() NOT NULL,
	"actor_user_id" uuid,
	"actor_type" varchar(20) DEFAULT 'user' NOT NULL,
	"action" varchar(100) NOT NULL,
	"target_type" varchar(100),
	"target_id" varchar(255),
	"ip" varchar(45),
	"user_agent" text,
	"request_id" varchar(100),
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "oidc_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar(255) NOT NULL,
	"client_secret_hash" text,
	"name" varchar(255) NOT NULL,
	"description" text,
	"redirect_uris" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"post_logout_redirect_uris" jsonb DEFAULT '[]'::jsonb,
	"grant_types" jsonb DEFAULT '["authorization_code"]'::jsonb NOT NULL,
	"response_types" jsonb DEFAULT '["code"]'::jsonb NOT NULL,
	"scopes" jsonb DEFAULT '["openid","profile","email"]'::jsonb NOT NULL,
	"token_endpoint_auth_method" varchar(50) DEFAULT 'client_secret_basic' NOT NULL,
	"is_first_party" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "oidc_clients_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "oidc_kv" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model" varchar(50) NOT NULL,
	"key" varchar(255) NOT NULL,
	"payload" jsonb NOT NULL,
	"expires_at" timestamp,
	"user_code" varchar(255),
	"uid" varchar(255),
	"grant_id" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" varchar(100),
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"password_hash" text,
	"department" varchar(255),
	"position" varchar(255),
	"avatar_url" text,
	"role_id" varchar(50),
	"role_name" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_employee_id_unique" UNIQUE("employee_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_at_idx" ON "audit_logs" USING btree ("at");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_target_type_idx" ON "audit_logs" USING btree ("target_type");--> statement-breakpoint
CREATE INDEX "audit_logs_request_id_idx" ON "audit_logs" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "oidc_clients_client_id_idx" ON "oidc_clients" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "oidc_clients_is_active_idx" ON "oidc_clients" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "oidc_kv_model_key_idx" ON "oidc_kv" USING btree ("model","key");--> statement-breakpoint
CREATE INDEX "oidc_kv_expires_at_idx" ON "oidc_kv" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "oidc_kv_user_code_idx" ON "oidc_kv" USING btree ("user_code");--> statement-breakpoint
CREATE INDEX "oidc_kv_uid_idx" ON "oidc_kv" USING btree ("uid");--> statement-breakpoint
CREATE INDEX "oidc_kv_grant_id_idx" ON "oidc_kv" USING btree ("grant_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_employee_id_idx" ON "users" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "users_department_idx" ON "users" USING btree ("department");