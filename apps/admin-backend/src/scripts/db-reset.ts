import postgres from "postgres";
import { getDatabaseConfig } from "../config/database.js";

const sql = postgres(getDatabaseConfig());

async function main() {
  await sql`DROP SCHEMA public CASCADE`;
  await sql`CREATE SCHEMA public`;
  console.log("[db:reset] public schema recreated");
  await sql.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
