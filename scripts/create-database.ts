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
    
    // Check if the rsvp database already exists
    const existingDb = await sql`
      SELECT 1 FROM pg_database WHERE datname = 'rsvp'
    `;
    
    if (existingDb.length > 0) {
      console.log('Database "rsvp" already exists.');
    } else {
      // Create the rsvp database
      // We need to use text mode because CREATE DATABASE can't be parameterized
      await sql.unsafe('CREATE DATABASE rsvp');
      console.log('Database "rsvp" created successfully!');
    }
    
    // Close the connection
    await sql.end();
    
    // Now test connection to the new database
    console.log('\nTesting connection to the rsvp database...');
    const rsvpConnectionString = "postgresql://postgres:admin@localhost:5432/rsvp";
    const rsvpSql = postgres(rsvpConnectionString, {
      max: 1,
      idle_timeout: 10
    });
    
    const result = await rsvpSql`SELECT version()`;
    console.log('✅ Connection to "rsvp" database successful!');
    console.log('PostgreSQL version:', result[0].version);
    
    await rsvpSql.end();
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
