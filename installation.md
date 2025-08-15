rename the env.example file to .env
run `npm install` to root directory to install dependencies
run `npx drizzle-kit generate` to generate migrations
run `npx drizzle-kit push` to apply migrations to the database
run `npx ts-node -P tsconfig.scripts.json scripts/db-seed.ts` to seed the database with initial data