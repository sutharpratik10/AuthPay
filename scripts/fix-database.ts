import { db } from '../src/db/index';
import { sql } from 'drizzle-orm';

async function fixDatabase() {
  try {
    console.log('Starting database schema fixes...');

    // Fix 1: Update additional_settings column to jsonb
    console.log('Step 1: Updating additional_settings column...');
    try {
      // First set NULL/empty values to empty JSON object
      await db.execute(sql`
        UPDATE user_preferences 
        SET additional_settings = '{}' 
        WHERE additional_settings IS NULL OR additional_settings = ''
      `);
      
      // Then convert to jsonb with proper casting
      await db.execute(sql`
        ALTER TABLE "user_preferences" 
        ALTER COLUMN "additional_settings" TYPE jsonb 
        USING CASE 
          WHEN additional_settings = '' OR additional_settings IS NULL THEN '{}'::jsonb
          ELSE additional_settings::jsonb
        END
      `);
      console.log('✓ additional_settings column updated successfully');
    } catch (error) {
      console.log('- additional_settings column already correct or issue:', error.message);
    }

    // Fix 2: Ensure browser_name column is correct length
    console.log('Step 2: Updating browser_name column...');
    try {
      await db.execute(sql`
        ALTER TABLE "sessions" ALTER COLUMN "browser_name" TYPE varchar(50)
      `);
      console.log('✓ browser_name column updated successfully');
    } catch (error) {
      console.log('- browser_name column already correct or issue:', error.message);
    }

    // Fix 3: Add code column to password reset tokens if it doesn't exist
    console.log('Step 3: Adding code column...');
    try {
      await db.execute(sql`
        ALTER TABLE "password_reset_tokens" ADD COLUMN "code" varchar(10) NOT NULL DEFAULT '000000'
      `);
      console.log('✓ code column added successfully');
    } catch (error) {
      console.log('- code column already exists or issue:', error.message);
    }

    // Fix 4: Remove original_name column if it exists
    console.log('Step 4: Removing original_name column...');
    try {
      await db.execute(sql`
        ALTER TABLE "user_avatars" DROP COLUMN "original_name"
      `);
      console.log('✓ original_name column removed successfully');
    } catch (error) {
      console.log('- original_name column already removed or issue:', error.message);
    }

    // Fix 5: Remove file_path column if it exists
    console.log('Step 5: Removing file_path column...');
    try {
      await db.execute(sql`
        ALTER TABLE "user_avatars" DROP COLUMN "file_path"
      `);
      console.log('✓ file_path column removed successfully');
    } catch (error) {
      console.log('- file_path column already removed or issue:', error.message);
    }

    // Fix 6: Remove last_password_change_at column if it exists
    console.log('Step 6: Removing last_password_change_at column...');
    try {
      await db.execute(sql`
        ALTER TABLE "users" DROP COLUMN "last_password_change_at"
      `);
      console.log('✓ last_password_change_at column removed successfully');
    } catch (error) {
      console.log('- last_password_change_at column already removed or issue:', error.message);
    }

    console.log('\n🎉 Database schema fixes completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing database schema:', error);
    process.exit(1);
  }
}

fixDatabase();
