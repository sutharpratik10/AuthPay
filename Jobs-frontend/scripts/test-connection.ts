import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testConnection() {
  // Test with the connection string from .env
  const connectionString = process.env.DATABASE_URL || '';
  console.log('Testing connection with .env DATABASE_URL:', connectionString);try {
    // Create a connection
    const sql = postgres(connectionString, { 
      max: 1,
      idle_timeout: 10
    });
    
    // Test connection with a simple query
    const result = await sql`SELECT version()`;
    
    console.log('✅ Connection successful!');
    console.log('PostgreSQL version:', result[0].version);
    
    // Close the connection
    await sql.end();
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

// Execute the test
testConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
