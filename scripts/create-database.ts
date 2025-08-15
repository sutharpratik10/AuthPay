import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function createDatabase() {
  // Connect to the default postgres database
  const connectionString = "postgresql://postgres:admin@localhost:5432/postgres";
  console.log('Connecting to PostgreSQL to create database...');
  
  try {
    // Create a connection
    const sql = postgres(connectionString, { 
      max: 1,
      idle_timeout: 10
    });
    
    // Check if the trueauth database already exists
    const existingDb = await sql`
      SELECT 1 FROM pg_database WHERE datname = 'trueauth'
    `;
    
    if (existingDb.length > 0) {
      console.log('Database "trueauth" already exists.');
    } else {
      // Create the trueauth database
      // We need to use text mode because CREATE DATABASE can't be parameterized
      await sql.unsafe('CREATE DATABASE trueauth');
      console.log('Database "trueauth" created successfully!');
    }
    
    // Close the connection
    await sql.end();
    
    // Now test connection to the new database
    console.log('\nTesting connection to the trueauth database...');
    const trueauthConnectionString = "postgresql://postgres:admin@localhost:5432/trueauth";
    const trueauthSql = postgres(trueauthConnectionString, {
      max: 1,
      idle_timeout: 10
    });

    const result = await trueauthSql`SELECT version()`;;
    console.log('✅ Connection to "trueauth" database successful!');
    console.log('PostgreSQL version:', result[0].version);

    await trueauthSql.end();
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
