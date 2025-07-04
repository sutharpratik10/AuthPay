import { db } from '../src/db/index';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

async function runSqlFile(filePath: string) {
  try {
    const sqlContent = fs.readFileSync(filePath, 'utf-8');
    console.log('Executing SQL migration...');
    console.log('SQL Content:', sqlContent);
    
    // Split the SQL into individual statements and execute them one by one
    const statements = sqlContent
      .split(/;\s*(?=(?:[^']*'[^']*')*[^']*$)/) // Split on semicolons not inside quotes
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing statement:', statement.substring(0, 100) + '...');
        await db.execute(sql.raw(statement));
      }
    }
    
    console.log('Migration executed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error executing migration:', error);
    process.exit(1);
  }
}

// Get the SQL file path from command line arguments
const sqlFilePath = process.argv[2];
if (!sqlFilePath) {
  console.error('Please provide a SQL file path');
  process.exit(1);
}

runSqlFile(path.resolve(sqlFilePath));
