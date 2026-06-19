import { defineConfig } from "drizzle-kit";
import { getDatabaseConfig } from "./src/config/database.ts";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: getDatabaseConfig(),
  verbose: true,
  strict: true,
});
