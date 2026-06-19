import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getDatabaseConfig } from "../config/database.js";
import * as schema from "./schema.js";

const client = postgres(getDatabaseConfig());

export const db = drizzle(client, {
  schema,
});
