ALTER TABLE "admin_fields" ALTER COLUMN "input_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."field_input_type";--> statement-breakpoint
CREATE TYPE "public"."field_input_type" AS ENUM('text', 'textarea', 'integer', 'float', 'checkbox', 'switch', 'date', 'time', 'datetime', 'select', 'multiselect');--> statement-breakpoint
ALTER TABLE "admin_fields" ALTER COLUMN "input_type" SET DATA TYPE "public"."field_input_type" USING "input_type"::"public"."field_input_type";--> statement-breakpoint
ALTER TABLE "admin_fields" ALTER COLUMN "db_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_fields" ADD COLUMN "relation_target_table_id" uuid;--> statement-breakpoint
ALTER TABLE "admin_tables" ADD COLUMN "group_key" text;--> statement-breakpoint
ALTER TABLE "admin_tables" ADD COLUMN "group_name" text;--> statement-breakpoint
ALTER TABLE "admin_tables" ADD COLUMN "show_in_menu" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_fields" ADD CONSTRAINT "admin_fields_relation_target_table_id_admin_tables_id_fk" FOREIGN KEY ("relation_target_table_id") REFERENCES "public"."admin_tables"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_fields_table_id_idx" ON "admin_fields" USING btree ("table_id");--> statement-breakpoint
CREATE INDEX "admin_fields_relation_target_table_id_idx" ON "admin_fields" USING btree ("relation_target_table_id");--> statement-breakpoint
CREATE INDEX "admin_tables_group_key_idx" ON "admin_tables" USING btree ("group_key");--> statement-breakpoint
CREATE INDEX "admin_tables_show_in_menu_idx" ON "admin_tables" USING btree ("show_in_menu");--> statement-breakpoint
CREATE INDEX "admin_tables_sort_order_idx" ON "admin_tables" USING btree ("sort_order");--> statement-breakpoint
ALTER TABLE "admin_tables" DROP COLUMN "db_name";