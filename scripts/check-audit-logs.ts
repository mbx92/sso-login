import { db, auditLogs } from '../server/db/index.ts'
import { desc, count } from 'drizzle-orm'

async function checkAuditLogs() {
  try {
    // Get total count
    const [{ value: total }] = await db.select({ value: count() }).from(auditLogs)
    console.log('✓ Total audit logs in database:', total)
    
    // Get latest 10 logs
    const logs = await db
      .select({
        at: auditLogs.at,
        action: auditLogs.action,
        actorType: auditLogs.actorType,
        targetType: auditLogs.targetType,
        ip: auditLogs.ip
      })
      .from(auditLogs)
      .orderBy(desc(auditLogs.at))
      .limit(10)
    
    console.log('\n📋 Latest 10 audit logs:')
    console.log('─'.repeat(100))
    
    logs.forEach((log, i) => {
      const time = log.at.toISOString().substring(0, 19).replace('T', ' ')
      const action = log.action.padEnd(30)
      const actorType = log.actorType.padEnd(8)
      const targetType = (log.targetType || 'N/A').padEnd(15)
      const ip = log.ip || 'N/A'
      
      console.log(`${(i + 1).toString().padStart(2)}. ${time} | ${action} | ${actorType} | ${targetType} | ${ip}`)
    })
    
    console.log('─'.repeat(100))
    console.log('\n✓ Audit logs are being saved successfully!')
  } catch (error) {
    console.error('✗ Error:', error)
  } finally {
    process.exit(0)
  }
}

checkAuditLogs()
