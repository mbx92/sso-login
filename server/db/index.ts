import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Get database URL from environment
const getDatabaseUrl = (): string => {
  const url = process.env.DATABASE_URL || 'postgres://localhost:5432/sso_db'
  console.log('Database URL (masked):', url.replace(/:[^:@]+@/, ':****@'))
  return url
}

// Create postgres client
const queryClient = postgres(getDatabaseUrl(), {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10
})

// Create drizzle instance with schema
export const db = drizzle(queryClient, { schema })

// Export schema for convenience
export * from './schema'
export { 
  accessGroups, 
  accessGroupUsers, 
  accessGroupClients,
  accessGroupsRelations,
  accessGroupUsersRelations,
  accessGroupClientsRelations
} from './schema'

// Export postgres client for raw queries if needed
export { queryClient }
