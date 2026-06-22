
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/server/db/schema/schema";
import * as dotenv from "dotenv";
import { sql, Table } from "drizzle-orm";

dotenv.config();

async function main() {
    console.log("🚀 Starting verification and migration...");

    // 1. Local Connection
    if (!process.env.LOCAL_DATABASE_URL) {
        throw new Error("LOCAL_DATABASE_URL is missing in .env");
    }
    const localPool = new Pool({ connectionString: process.env.LOCAL_DATABASE_URL });
    const dbLocal = drizzle(localPool, { schema });
    console.log("✅ Connected to Local DB");

    // 2. Cloud Connection
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is missing in .env");
    }
    console.log(`Connecting to Cloud DB: ${process.env.DATABASE_URL.split('@')[1]}`); // Log host only

    // Aiven requires SSL
    // Strip ?sslmode=... from URL to prevent pg from overriding our manual SSL config
    const cloudUrl = process.env.DATABASE_URL.split('?')[0];
    const cloudPool = new Pool({
        connectionString: cloudUrl,
        ssl: { rejectUnauthorized: false } // Trust self-signed or Aiven certs for migration simplicity
    });
    const dbCloud = drizzle(cloudPool, { schema });
    console.log("✅ Connected to Cloud DB");

    // 3. Define Migration Order (Parents first, Children last)
    const tables = [
        // Lookups / Independent
        { name: "languages", table: schema.languages },
        { name: "timezones", table: schema.timezones },
        { name: "subscriptionStatuses", table: schema.subscriptionStatuses },
        { name: "subscriptionRenewalTypes", table: schema.subscriptionRenewalTypes },
        { name: "subscriptionPlans", table: schema.subscriptionPlans },
        { name: "permissions", table: schema.permissions },
        { name: "roles", table: schema.roles },

        // Core User
        { name: "users", table: schema.users },

        // User Related
        { name: "accounts", table: schema.accounts },
        { name: "sessions", table: schema.sessions },
        { name: "userPreferences", table: schema.userPreferences },
        { name: "userRoles", table: schema.userRoles },
        { name: "rolePermissions", table: schema.rolePermissions },
        { name: "userAvatars", table: schema.userAvatars },

        // Auth / Security
        { name: "otpCodes", table: schema.otpCodes },
        { name: "recoveryCodes", table: schema.recoveryCodes },
        { name: "twoFactorAuth", table: schema.twoFactorAuth },
        { name: "verificationTokens", table: schema.verificationTokens },
        { name: "passwordResetTokens", table: schema.passwordResetTokens },

        // Billing / Subscription
        { name: "userSubscriptions", table: schema.userSubscriptions },
        { name: "billings", table: schema.billings },
        { name: "paymentOrders", table: schema.paymentOrders },
        { name: "paymentTransactions", table: schema.paymentTransactions },
        { name: "subscriptionAnalytics", table: schema.subscriptionAnalytics },

        // Logs / Metrics
        { name: "adminNotifications", table: schema.adminNotifications },
        { name: "adminDashboardStats", table: schema.adminDashboardStats },
        { name: "userUsageMetrics", table: schema.userUsageMetrics },
        { name: "auditLogs", table: schema.auditLogs },
        { name: "errorLogs", table: schema.errorLogs },
        { name: "userNotifications", table: schema.userNotifications },


    ];

    // 4. Migrate Data
    for (const { name, table } of tables) {
        try {
            console.log(`\n📦 Migrating table: ${name}...`);

            // Fetch local data
            const data = await dbLocal.select().from(table);

            if (data.length === 0) {
                console.log(`   Internal: No data in local ${name}. Skipping.`);
                continue;
            }

            console.log(`   Found ${data.length} records. Inserting to cloud...`);

            // Insert in batches of 50 to avoid packet size issues
            const batchSize = 50;
            for (let i = 0; i < data.length; i += batchSize) {
                const batch = data.slice(i, i + batchSize);
                await dbCloud.insert(table).values(batch).onConflictDoNothing();
            }

            console.log(`   ✅ Success: ${name} migrated.`);
        } catch (error) {
            console.error(`   ❌ Failed to migrate ${name}:`, error);
            // Optional: throw error to stop, or continue
            // throw error; 
        }
    }

    console.log("\n🎉 Migration Complete!");
    await localPool.end();
    await cloudPool.end();
}

main().catch((err) => {
    console.error("Fatal Error:", err);
    process.exit(1);
});
