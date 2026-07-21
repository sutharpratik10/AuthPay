import postgres from 'postgres';
import 'dotenv/config';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is missing');
  }
  const sql = postgres(process.env.DATABASE_URL);
  try {
    const result = await sql`SELECT * FROM drizzle.__drizzle_migrations`;
    console.log(result);
  } catch (e) {
    console.error(e);
  }
  await sql.end();
}
main();
