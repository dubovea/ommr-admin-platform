import { defineConfig } from "drizzle-kit";
import { getDatabaseConfig } from "./src/config/database.ts";

export default defineConfig({
  schema: "apps/admin-backend/src/db/schema.ts",
  out: "apps/admin-backend/drizzle",
  dialect: "postgresql",
  dbCredentials: getDatabaseConfig(),
  verbose: true,
  strict: true,
});
