import postgres from 'postgres'
import 'dotenv/config'

const sql = postgres(process.env.DATABASE_URL!)

async function main() {
  try {
    const migs = await sql`SELECT * FROM __drizzle_migrations ORDER BY created_at`
    console.log('Applied migrations:', migs.map(m => m.hash).join(', '))
    
    // Check specific columns
    const rolesCols = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'roles' AND column_name IN ('permissions', 'site_id', 'is_system')
    `
    console.log('Roles columns (permissions, site_id, is_system):', rolesCols.map(c => c.column_name).join(', '))
    
    const oidcCols = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'oidc_clients' AND column_name = 'site_id'
    `
    console.log('oidc_clients has site_id:', oidcCols.length > 0 ? 'YES' : 'NO')
    
  } catch (error) {
    console.error('Error:', error)
  }
  await sql.end()
}

main()
