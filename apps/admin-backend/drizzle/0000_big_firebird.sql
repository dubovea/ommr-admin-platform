CREATE TYPE "public"."field_input_type" AS ENUM('text', 'textarea', 'number', 'checkbox', 'switch', 'date', 'time', 'datetime', 'select', 'multiselect');--> statement-breakpoint
CREATE TYPE "public"."table_source" AS ENUM('pydantic', 'manual');--> statement-breakpoint
CREATE TYPE "public"."table_status" AS ENUM('draft', 'needs_setup', 'ready', 'partial');--> statement-breakpoint
CREATE TABLE "admin_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_id" uuid NOT NULL,
	"name" text NOT NULL,
	"label" text NOT NULL,
	"db_type" text NOT NULL,
	"input_type" "field_input_type" NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"editable" boolean DEFAULT true NOT NULL,
	"sortable" boolean DEFAULT false NOT NULL,
	"filterable" boolean DEFAULT false NOT NULL,
	"group_name" text,
	"default_value" jsonb,
	"options" jsonb,
	"validation" jsonb,
	"placeholder" text,
	"help_text" text,
	"relation" jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_tables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"db_name" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"icon" text DEFAULT 'table',
	"status" "table_status" DEFAULT 'needs_setup' NOT NULL,
	"source" "table_source" DEFAULT 'pydantic' NOT NULL,
	"can_list" boolean DEFAULT true NOT NULL,
	"can_create" boolean DEFAULT true NOT NULL,
	"can_edit" boolean DEFAULT true NOT NULL,
	"can_delete" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_fields" ADD CONSTRAINT "admin_fields_table_id_admin_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."admin_tables"("id") ON DELETE cascade ON UPDATE no action;