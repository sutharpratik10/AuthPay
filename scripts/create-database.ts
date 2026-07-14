import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
import path from 'path';
import fs from 'fs';
const root = path.resolve(process.cwd());
const envLocal = path.join(root, '.env.local');
const envDefault = path.join(root, '.env');
const chosenEnv = fs.existsSync(envLocal) ? envLocal : envDefault;
dotenv.config({ path: chosenEnv, override: true });

// Function to get the application name
function getAppName(): string {
  return process.env.APP_NAME || 'Authpay';
}

async function createDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL must be defined");
  const parsed = new URL(dbUrl);
  const dbName = parsed.pathname.slice(1) || 'postgres';


  parsed.pathname = "/postgres";
  const connectionString = parsed.toString();
  console.log('Connecting to PostgreSQL to create database...');
  console.log(`Target database name: "${dbName}"`);

  try {
    // Create a connection
    const sql = postgres(connectionString, {
      max: 1,
      idle_timeout: 10
    });

    // Check if the database already exists
    const existingDb = await sql`
      SELECT 1 FROM pg_database WHERE datname = ${dbName}
    `;

    if (existingDb.length > 0) {
      console.log(`Database "${dbName}" already exists.`);
    } else {
      // Create the database
      // We need to use text mode because CREATE DATABASE can't be parameterized
      await sql.unsafe(`CREATE DATABASE ${dbName}`);
      console.log(`Database "${dbName}" created successfully!`);
    }

    // Close the connection
    await sql.end();

    // Now test connection to the new database
    console.log(`\nTesting connection to the ${dbName} database...`);
    parsed.pathname = `/${dbName}`;
    const targetConnectionString = parsed.toString();
    const targetSql = postgres(targetConnectionString, {
      max: 1,
      idle_timeout: 10
    });

    const result = await targetSql`SELECT version()`;
    console.log(`✅ Connection to "${dbName}" database successful!`);
    console.log('PostgreSQL version:', result[0].version);

    await targetSql.end();
    return true;
  } catch (error) {
    console.error('❌ Operation failed:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

// Execute the function
createDatabase()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
