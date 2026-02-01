
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    console.log("🔍 Verifying Cloud Database...");

    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is missing");
    }

    // Strip sslmode from URL
    const connectionString = process.env.DATABASE_URL.split('?')[0];

    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        // Check if tables exist
        const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

        console.log(`✅ Found ${res.rowCount} tables in public schema.`);

        if (res.rowCount === 0) {
            console.error("❌ No tables found! Schema push failed.");
            process.exit(1);
        }

        // Check key tables for data
        const tablesToCheck = ['users', 'businesses', 'services', 'appointments'];
        const tables = res.rows.map(r => r.table_name);

        for (const table of tablesToCheck) {
            if (tables.includes(table)) {
                const countRes = await pool.query(`SELECT COUNT(*) FROM "${table}"`);
                console.log(`   - ${table}: ${countRes.rows[0].count} records`);
            } else {
                console.warn(`   ⚠️ Table ${table} is missing!`);
            }
        }

    } catch (err) {
        console.error("❌ Connection failed:", err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
