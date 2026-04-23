import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!);

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