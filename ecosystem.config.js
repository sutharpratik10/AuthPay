const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env if it exists
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Ensure the DATABASE_URL points to the pgBouncer port (6432) instead of direct Postgres
let pgbouncerUrl = '';
if (process.env.DATABASE_URL) {
  try {
    const dbUrl = new URL(process.env.DATABASE_URL);
    dbUrl.port = '6432';
    pgbouncerUrl = dbUrl.toString();
  } catch (error) {
    console.error("Failed to parse DATABASE_URL from .env", error);
  }
}

module.exports = {
  apps: [
    {
      name: "authpay-web",
      script: ".next/standalone/server.js",
      // 'max' utilizes all available CPU cores. Adjust to a specific number (e.g., 2 or 4) if desired.
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "127.0.0.1",

        // Use the dynamically parsed pgBouncer URL
        DATABASE_URL: pgbouncerUrl
      }
    }
  ]
};
