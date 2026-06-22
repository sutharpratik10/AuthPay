import { db } from '../src/server/db';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "login_history" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "ip_address" varchar(45),
        "location" varchar(255),
        "device" varchar(255),
        "os" varchar(255),
        "browser" varchar(255),
        "user_agent" text,
        "login_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log("Table 'login_history' created successfully.");
  } catch (error) {
    console.error("Error creating table:", error);
  } finally {
    process.exit(0);
  }
}

run();
