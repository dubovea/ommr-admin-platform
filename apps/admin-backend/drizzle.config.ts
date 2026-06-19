import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "drizzle-kit";
import { getDatabaseConfig } from "./src/config/database.ts";

const configDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  schema: path.join(configDir, "src/db/schema.ts"),
  out: path.join(configDir, "drizzle"),
  dialect: "postgresql",
  dbCredentials: getDatabaseConfig(),
  verbose: true,
  strict: true,
});
