/**
 * Reset SSO database and import org/users from legacy MySQL dump (bros_hrs_1.sql)
 *
 * Mapping:
 *   companies (comp_id)  → sites
 *   divisions            → divisions
 *   division_units       → units
 *   employees + users    → users (email from legacy users when available)
 *
 * ⚠ PERINGATAN: Script ini TRUNCATE SEMUA tabel termasuk oidc_clients!
 *    Setelah menjalankan script ini, SEMUA OIDC client akan hilang.
 *    Jalankan scripts/import-oidc-clients.js untuk mengembalikannya.
 *
 * Usage:
 *   node --env-file=.env scripts/import-legacy-hrs.js
 *   node --env-file=.env scripts/import-oidc-clients.js   # restore OIDC clients
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'
import * as argon2 from 'argon2'
import { randomUUID } from 'node:crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const sqlPath = path.join(root, 'bros_hrs_1.sql')

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

const SUPERADMIN_EMAIL = (process.env.SUPERADMIN_EMAIL || 'admin@example.com').toLowerCase()
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || 'password123!'
const DEFAULT_USER_PASSWORD = process.env.HRIS_DEFAULT_PASSWORD || 'Welcome123!'

const SITE_MAP = {
  '1': { code: 'BROS', name: 'Bali Royal Hospital', description: 'Legacy comp_id=1' },
  '2': { code: 'RSIA', name: 'RSIA', description: 'Legacy comp_id=2' },
  '3': { code: 'PHJ', name: 'PT Putra Husada Jaya', description: 'Legacy comp_id=3 (holding)' },
}

function parseInsert(sql, table) {
  const re = new RegExp(
    String.raw`insert\s+into\s+\`${table}\`\(([^)]+)\)\s+values\s+([\s\S]*?);`,
    'i',
  )
  const m = sql.match(re)
  if (!m) return []
  const cols = m[1].split(',').map((s) => s.replace(/[`\s]/g, ''))
  const body = m[2]
  const rows = []
  let i = 0
  while (i < body.length) {
    while (i < body.length && body[i] !== '(') i++
    if (i >= body.length) break
    i++
    const vals = []
    let cur = ''
    let inStr = false
    let esc = false
    for (; i < body.length; i++) {
      const ch = body[i]
      if (esc) {
        cur += ch
        esc = false
        continue
      }
      if (ch === '\\' && inStr) {
        cur += ch
        esc = true
        continue
      }
      if (ch === "'") {
        inStr = !inStr
        cur += ch
        continue
      }
      if (!inStr && (ch === ',' || ch === ')')) {
        vals.push(cur.trim())
        cur = ''
        if (ch === ')') {
          i++
          break
        }
        continue
      }
      cur += ch
    }
    const obj = {}
    cols.forEach((c, idx) => {
      obj[c] = unquote(vals[idx])
    })
    rows.push(obj)
  }
  return rows
}

function unquote(v) {
  if (v == null || v === 'NULL') return null
  if (v.startsWith("'") && v.endsWith("'")) {
    return v
      .slice(1, -1)
      .replace(/\\'/g, "'")
      .replace(/''/g, "'")
      .replace(/\\r/g, '\r')
      .replace(/\\n/g, '\n')
  }
  return v
}

function slugCode(code, fallback) {
  const raw = (code || fallback || 'X').toString().trim().toUpperCase()
  return raw.replace(/[^A-Z0-9_-]/g, '_').slice(0, 50) || 'X'
}

async function main() {
  console.log('Reading legacy dump...')
  const dump = fs.readFileSync(sqlPath, 'utf8')
  const legacyDivisions = parseInsert(dump, 'divisions')
  const legacyUnits = parseInsert(dump, 'division_units')
  const legacyEmployees = parseInsert(dump, 'employees')
  const legacyUsers = parseInsert(dump, 'users')

  console.log(`Parsed: divisions=${legacyDivisions.length}, units=${legacyUnits.length}, employees=${legacyEmployees.length}, users=${legacyUsers.length}`)

  const sql = postgres(DATABASE_URL, { max: 1 })

  try {
    console.log('\nResetting SSO database...')
    await sql.unsafe(`
      TRUNCATE TABLE
        access_group_clients,
        access_group_users,
        access_groups,
        user_app_access,
        user_roles,
        audit_logs,
        oidc_kv,
        oidc_clients,
        units,
        divisions,
        users,
        roles,
        sites
      RESTART IDENTITY CASCADE
    `)
    console.log('Tables truncated.')

    // Roles
    console.log('\nSeeding roles...')
    const roleRows = await sql`
      INSERT INTO roles (id, name, description, permissions, is_system)
      VALUES
        (${randomUUID()}, 'superadmin', 'Full system access', ${sql.json([])}, true),
        (${randomUUID()}, 'admin', 'Administrative access', ${sql.json([])}, true),
        (${randomUUID()}, 'user', 'Regular user', ${sql.json([])}, true)
      RETURNING id, name
    `
    const roleByName = Object.fromEntries(roleRows.map((r) => [r.name, r.id]))

    // Superadmin
    console.log('Seeding superadmin...')
    const adminHash = await argon2.hash(SUPERADMIN_PASSWORD, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    })
    const [admin] = await sql`
      INSERT INTO users (id, email, name, status, password_hash, role_id, role_name)
      VALUES (
        ${randomUUID()},
        ${SUPERADMIN_EMAIL},
        ${'System Administrator'},
        ${'active'},
        ${adminHash},
        ${roleByName.superadmin},
        ${'superadmin'}
      )
      RETURNING id
    `
    await sql`
      INSERT INTO user_roles (user_id, role_id)
      VALUES (${admin.id}, ${roleByName.superadmin})
    `

    // Sites
    console.log('\nImporting sites...')
    const siteIdByComp = {}
    for (const [compId, meta] of Object.entries(SITE_MAP)) {
      const [site] = await sql`
        INSERT INTO sites (id, code, name, description, use_divisions, use_units, is_active)
        VALUES (
          ${randomUUID()},
          ${meta.code},
          ${meta.name},
          ${meta.description},
          true,
          true,
          true
        )
        RETURNING id, code
      `
      siteIdByComp[compId] = site.id
      console.log(`  + ${site.code}`)
    }

    // Divisions (skip soft-deleted)
    console.log('\nImporting divisions...')
    const divisionIdByLegacy = {}
    const usedDivCodes = new Set()
    let divCount = 0
    for (const d of legacyDivisions) {
      if (d.deleted_at) continue
      const siteId = siteIdByComp[d.comp_id]
      if (!siteId) continue

      let code = slugCode(d.dvs_kode, `DIV${d.dvs_id}`)
      if (usedDivCodes.has(code)) code = slugCode(`${code}_${d.dvs_id}`)
      usedDivCodes.add(code)

      const [row] = await sql`
        INSERT INTO divisions (id, site_id, code, name, description, is_active)
        VALUES (
          ${randomUUID()},
          ${siteId},
          ${code},
          ${d.dvs_name || code},
          ${null},
          ${d.dvs_status === '1' || d.dvs_status === 1}
        )
        RETURNING id
      `
      divisionIdByLegacy[d.dvs_id] = row.id
      divCount++
    }
    console.log(`  imported ${divCount} divisions`)

    // Units
    console.log('\nImporting units...')
    const unitIdByLegacy = {}
    const usedUnitCodes = new Set()
    let unitCount = 0
    let skippedUnits = 0
    for (const u of legacyUnits) {
      if (u.deleted_at) continue
      const siteId = siteIdByComp[u.comp_id]
      const divisionId = divisionIdByLegacy[u.dvs_id]
      if (!siteId || !divisionId) {
        skippedUnits++
        continue
      }

      let code = slugCode(u.unt_kode, `UNT${u.unt_id}`)
      if (usedUnitCodes.has(code)) code = slugCode(`${code}_${u.unt_id}`)
      usedUnitCodes.add(code)

      const [row] = await sql`
        INSERT INTO units (id, site_id, division_id, code, name, description, is_active)
        VALUES (
          ${randomUUID()},
          ${siteId},
          ${divisionId},
          ${code},
          ${u.unt_name || code},
          ${null},
          ${u.unt_status === '1' || u.unt_status === 1}
        )
        RETURNING id
      `
      unitIdByLegacy[u.unt_id] = row.id
      unitCount++
    }
    console.log(`  imported ${unitCount} units (skipped ${skippedUnits})`)

    // Index employees + divisions/units for enrichment
    const empById = new Map(legacyEmployees.map((e) => [e.emp_id, e]))
    const divById = new Map(legacyDivisions.map((d) => [d.dvs_id, d]))
    const unitById = new Map(legacyUnits.map((u) => [u.unt_id, u]))

    // Build email map: prefer first user per emp_id
    const userByEmpId = new Map()
    for (const u of legacyUsers) {
      if (!u.emp_id || !u.email) continue
      if (!userByEmpId.has(u.emp_id)) userByEmpId.set(u.emp_id, u)
    }

    console.log('\nImporting users from employees...')
    const defaultHash = await argon2.hash(DEFAULT_USER_PASSWORD, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    })

    const usedEmails = new Set([SUPERADMIN_EMAIL])
    const usedEmpCodes = new Set()
    let importedUsers = 0
    let withLoginEmail = 0
    let syntheticEmail = 0
    let skippedEmp = 0

    for (const emp of legacyEmployees) {
      if (emp.deleted_at) continue
      // keep both active and inactive for history, mark status accordingly
      const status = emp.emp_status === '1' || emp.emp_status === 1 ? 'active' : 'disabled'

      let empCode = (emp.emp_kode || `EMP${emp.emp_id}`).trim()
      if (!empCode) {
        skippedEmp++
        continue
      }
      if (usedEmpCodes.has(empCode)) empCode = `${empCode}_${emp.emp_id}`
      usedEmpCodes.add(empCode)

      const legacyUser = userByEmpId.get(emp.emp_id)
      let email = legacyUser?.email?.toLowerCase()?.trim()
      if (email && usedEmails.has(email)) {
        email = `${empCode.toLowerCase()}.${email}`
      }
      if (!email) {
        email = `${empCode.toLowerCase()}@sso.local`
        syntheticEmail++
      } else {
        withLoginEmail++
      }
      if (usedEmails.has(email)) {
        email = `${emp.emp_id}.${email}`
      }
      usedEmails.add(email)

      const unitId = unitIdByLegacy[emp.unt_id] || null
      const div = divById.get(emp.dvs_id)
      const unt = unitById.get(emp.unt_id)
      const name = emp.emp_full_name || legacyUser?.name || empCode

      await sql`
        INSERT INTO users (
          id, employee_id, email, name, status, password_hash,
          unit_id, department, position, role_id, role_name
        ) VALUES (
          ${randomUUID()},
          ${empCode},
          ${email},
          ${name},
          ${status},
          ${defaultHash},
          ${unitId},
          ${div?.dvs_name || null},
          ${unt?.unt_name || null},
          ${roleByName.user},
          ${'user'}
        )
      `
      importedUsers++
      if (importedUsers % 200 === 0) console.log(`  ... ${importedUsers}`)
    }

    // Counts
    const counts = await sql`
      SELECT
        (SELECT count(*)::int FROM sites) AS sites,
        (SELECT count(*)::int FROM divisions) AS divisions,
        (SELECT count(*)::int FROM units) AS units,
        (SELECT count(*)::int FROM users) AS users,
        (SELECT count(*)::int FROM roles) AS roles
    `

    console.log('\nDone.')
    console.log(counts[0])
    console.log(`Users imported: ${importedUsers} (with legacy email: ${withLoginEmail}, synthetic @sso.local: ${syntheticEmail}, skipped: ${skippedEmp})`)
    console.log('\nLogin:')
    console.log(`  Superadmin: ${SUPERADMIN_EMAIL} / ${SUPERADMIN_PASSWORD}`)
    console.log(`  HRIS users default password: ${DEFAULT_USER_PASSWORD}`)
  } finally {
    await sql.end({ timeout: 5 })
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
