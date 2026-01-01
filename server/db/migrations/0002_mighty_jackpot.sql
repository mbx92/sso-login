CREATE TABLE "sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"address" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sites_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "divisions" ADD COLUMN "site_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "site_id" uuid NOT NULL;--> statement-breakpoint
CREATE INDEX "sites_code_idx" ON "sites" USING btree ("code");--> statement-breakpoint
CREATE INDEX "sites_is_active_idx" ON "sites" USING btree ("is_active");--> statement-breakpoint
ALTER TABLE "divisions" ADD CONSTRAINT "divisions_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "divisions_site_id_idx" ON "divisions" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "units_site_id_idx" ON "units" USING btree ("site_id");