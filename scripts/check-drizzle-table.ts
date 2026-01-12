import postgres from 'postgres'
import 'dotenv/config'

const sql = postgres(process.env.DATABASE_URL!)

async function main() {
  try {
    // Get the structure of __drizzle_migrations
    const structure = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = '__drizzle_migrations'
      ORDER BY ordinal_position
    `
    console.log('Table structure:')
    for (const col of structure) {
      console.log(`  - ${col.column_name}: ${col.data_type}`)
    }
    
    // Get current data
    console.log('\nCurrent data:')
    const data = await sql`SELECT * FROM __drizzle_migrations ORDER BY id`
    console.log(JSON.stringify(data, null, 2))
    
  } catch (error) {
    console.error('Error:', error)
  }
  await sql.end()
}

main()
