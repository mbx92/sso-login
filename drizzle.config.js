import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './server/db/schema.js',
  out: './server/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://localhost:5432/sso_db'
  },
  verbose: true,
  strict: true
})
