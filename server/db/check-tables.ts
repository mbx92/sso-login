import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL || 'postgres://mbx:nopassword123!@10.100.10.5:5432/sso_db'

const sql = postgres(connectionString)

async function main() {
  console.log('Checking existing tables...')
  
  try {
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    
    console.log('\nExisting tables:')
    tables.forEach(row => console.log(`  - ${row.table_name}`))
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
  
  await sql.end()
}

main()
