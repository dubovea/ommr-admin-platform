import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required. Copy apps/admin-backend/.env.example to apps/admin-backend/.env",
  );
}

const client = postgres(databaseUrl);

export const db = drizzle(client, {
  schema,
});
