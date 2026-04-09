const pool = require('../config/database');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running OAuth migration...');
    
    // Add oauth_provider column
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50);
    `);
    console.log('Added oauth_provider column');
    
    // Add oauth_provider_id column
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider_id VARCHAR(255);
    `);
    console.log('Added oauth_provider_id column');
    
    // Add profile_picture column (if it doesn't exist)
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'profile_picture'
        ) THEN
          ALTER TABLE users ADD COLUMN profile_picture VARCHAR(500);
        END IF;
      END $$;
    `);
    console.log('Added profile_picture column');
    
    // Add index for OAuth lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_provider_id);
    `);
    console.log('Created OAuth index');
    
    console.log('OAuth migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
