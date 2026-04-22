import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required. Copy apps/api/.env.example to apps/api/.env");
}

const client = postgres(databaseUrl);

export const db = drizzle(client, {
  schema
});
