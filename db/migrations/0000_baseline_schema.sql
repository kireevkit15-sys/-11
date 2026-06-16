CREATE TABLE IF NOT EXISTS "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'editor' NOT NULL,
	"require_password_change" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "announcement_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(50),
	"message" text,
	"cta_text" varchar(100),
	"href" varchar(255),
	"badge" varchar(50),
	"hue" integer DEFAULT 200,
	"available" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"key" text NOT NULL,
	"category" text DEFAULT 'Общее' NOT NULL,
	"badge" text DEFAULT 'team' NOT NULL,
	"hue" integer DEFAULT 200 NOT NULL,
	"available" boolean DEFAULT true NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "announcements_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text,
	"body" text,
	"cover_url" text,
	"category" text DEFAULT 'Прочее' NOT NULL,
	"reading_minutes" integer DEFAULT 5 NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"payload" jsonb,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "calculator_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inputs" jsonb NOT NULL,
	"result_price" integer,
	"lead_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "case_studies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"client_name" text,
	"client_logo_url" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"task" text,
	"solution" text,
	"result" text,
	"quote" text,
	"quote_author" text,
	"period" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "case_studies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"next_contact_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "district_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"short_name" text NOT NULL,
	"name" text NOT NULL,
	"capital" text,
	"clients" integer DEFAULT 0 NOT NULL,
	"color" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "district_stats_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"category" text DEFAULT 'Бухгалтерия' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "footer_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(50) DEFAULT 'main',
	"email" varchar(255),
	"phones" jsonb DEFAULT '[]'::jsonb,
	"address" text,
	"legal_info" text,
	"work_hours" varchar(100),
	"nav_columns" jsonb DEFAULT '[]'::jsonb,
	"social_links" jsonb DEFAULT '[]'::jsonb,
	"copyright" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "frontend_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"page" text DEFAULT 'home' NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "frontend_sections_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fsi_deadline_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"telegram_chat_id" bigint NOT NULL,
	"grant_type" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "fsi_deadline_subscriptions_chat_grant_key" UNIQUE("telegram_chat_id","grant_type")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fsi_deadlines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"deadline_date" timestamp with time zone NOT NULL,
	"grant_type" text DEFAULT 'Старт' NOT NULL,
	"stage" text,
	"url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "glossary_terms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term" text NOT NULL,
	"definition" text NOT NULL,
	"category" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hero_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(50) DEFAULT 'main',
	"headline" text,
	"subheadline" text,
	"cta_text" varchar(100),
	"badges" jsonb DEFAULT '[]'::jsonb,
	"stat_number" varchar(50),
	"stat_label" varchar(100),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lead_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"text" text NOT NULL,
	"author" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"contact" text NOT NULL,
	"source" text,
	"page" text,
	"utm" jsonb,
	"status" text DEFAULT 'new' NOT NULL,
	"notes" text,
	"interaction_at" timestamp with time zone,
	"notified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "navigation_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"href" text NOT NULL,
	"type" text DEFAULT 'nav' NOT NULL,
	"icon" text,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "page_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_key" text NOT NULL,
	"version" integer NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "page_versions_page_version_key" UNIQUE("page_key","version")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"company" text,
	"logo_url" text,
	"bio" text,
	"skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"github_link" text,
	"portfolio_link" text,
	"vk_link" text,
	"telegram_link" text,
	"contact" text,
	"badge" text DEFAULT 'team' NOT NULL,
	"hue" integer DEFAULT 240 NOT NULL,
	"available" boolean DEFAULT true NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"category" text DEFAULT 'fullstack' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"chat_id" text NOT NULL,
	"message_id" integer NOT NULL,
	"fire_at" timestamp with time zone NOT NULL,
	"sent" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_name" text NOT NULL,
	"author_project" text,
	"text" text NOT NULL,
	"source" text DEFAULT 'Email' NOT NULL,
	"source_url" text,
	"rating" integer DEFAULT 5 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"tax_system" text DEFAULT 'УСН-Д' NOT NULL,
	"base_price" integer,
	"includes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"target_audience" text,
	"is_highlighted" boolean DEFAULT false NOT NULL,
	"key" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "site_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"group" text DEFAULT 'general' NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "site_statistics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" integer NOT NULL,
	"suffix" text,
	"label" text NOT NULL,
	"caption" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_statistics_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "social_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" text NOT NULL,
	"label" text NOT NULL,
	"href" text NOT NULL,
	"action_text" text,
	"icon_color" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"telegram_username" text,
	"source" text,
	"subscribed_at" timestamp with time zone DEFAULT now(),
	"unsubscribed_at" timestamp with time zone,
	CONSTRAINT "subscribers_email_unique" UNIQUE("email"),
	CONSTRAINT "subscribers_telegram_username_unique" UNIQUE("telegram_username")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"position" text NOT NULL,
	"photo_url" text,
	"bio" text,
	"education" text,
	"years_experience" integer,
	"specialization" text,
	"quote" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_founder" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trust_pillars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" text NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"quote" text,
	"hue" integer DEFAULT 270 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"video_id" text NOT NULL,
	"platform" text DEFAULT 'youtube' NOT NULL,
	"description" text,
	"views" integer DEFAULT 0 NOT NULL,
	"duration" text,
	"thumbnail_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_admin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "calculator_logs" ADD CONSTRAINT "calculator_logs_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clients" ADD CONSTRAINT "clients_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "frontend_sections" ADD CONSTRAINT "frontend_sections_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "page_versions" ADD CONSTRAINT "page_versions_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reminders" ADD CONSTRAINT "reminders_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_admin_users_email" ON "admin_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_announcements_key" ON "announcements" USING btree ("key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_announcements_sort_order" ON "announcements" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_articles_slug" ON "articles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_articles_category" ON "articles" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_articles_sort_order" ON "articles" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_user_id" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_action" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_entity" ON "audit_logs" USING btree ("entity");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_logs_created_at" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_calculator_logs_created_at" ON "calculator_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_case_studies_slug" ON "case_studies" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_case_studies_sort_order" ON "case_studies" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clients_lead_id" ON "clients" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_district_stats_code" ON "district_stats" USING btree ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_district_stats_sort_order" ON "district_stats" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_faqs_category" ON "faqs" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_faqs_sort_order" ON "faqs" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_frontend_sections_key" ON "frontend_sections" USING btree ("key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_frontend_sections_page" ON "frontend_sections" USING btree ("page");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_frontend_sections_sort_order" ON "frontend_sections" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fsi_deadlines_deadline_date" ON "fsi_deadlines" USING btree ("deadline_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fsi_deadlines_grant_type" ON "fsi_deadlines" USING btree ("grant_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_glossary_terms_term" ON "glossary_terms" USING btree ("term");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_glossary_terms_sort_order" ON "glossary_terms" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lead_notes_lead_id" ON "lead_notes" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_leads_created_at" ON "leads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_leads_status" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_leads_notified" ON "leads" USING btree ("notified");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_navigation_items_type" ON "navigation_items" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_navigation_items_sort_order" ON "navigation_items" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_page_versions_page_key" ON "page_versions" USING btree ("page_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_page_versions_version" ON "page_versions" USING btree ("version");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_page_versions_is_published" ON "page_versions" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_partners_category" ON "partners" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_partners_sort_order" ON "partners" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reminders_fire_at" ON "reminders" USING btree ("fire_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reviews_sort_order" ON "reviews" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_services_slug" ON "services" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_services_sort_order" ON "services" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_site_settings_key" ON "site_settings" USING btree ("key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_site_settings_group" ON "site_settings" USING btree ("group");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_site_statistics_key" ON "site_statistics" USING btree ("key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_site_statistics_sort_order" ON "site_statistics" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_social_links_sort_order" ON "social_links" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subscribers_email" ON "subscribers" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_team_members_sort_order" ON "team_members" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trust_pillars_sort_order" ON "trust_pillars" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_videos_sort_order" ON "videos" USING btree ("sort_order");