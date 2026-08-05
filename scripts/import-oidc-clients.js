/**
 * Import OIDC clients from sso_db.sql (PostgreSQL dump).
 *
 * Jalankan setelah scripts/import-legacy-hrs.js untuk mengembalikan
 * OIDC clients yang hilang karena TRUNCATE oidc_clients.
 *
 * Usage: node --env-file=.env scripts/import-oidc-clients.js
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const sqlPath = path.join(root, 'sso_db.sql')

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

/**
 * Parse PostgreSQL COPY data rows dari dump file.
 * Format: tab-separated values, \N = NULL, masing-masing baris diakhiri \n.
 */
function parseCopy(sql, table) {
  // Cari blok COPY public.<table> ... FROM stdin; ... \.
  const re = new RegExp(
    `COPY\\s+public\\.${table}\\s*\\([^)]*\\)\\s+FROM\\s+stdin;\\s*\\n([\\s\\S]*?)\\\\\\.`,
    'i',
  )
  const m = sql.match(re)
  if (!m) return []
  const body = m[1]
  const rows = body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split('\t').map(parseCopyValue))
  return rows
}

function parseCopyValue(v) {
  if (v === '\\N') return null
  // Hapus escaping COPY: backslash escapes
  return v.replace(/\\(.)/g, '$1')
}

function parseJson(v) {
  if (!v) return '[]'
  // COPY data menyimpan JSON sebagai teks, e.g. ["openid","profile"]
  try {
    JSON.parse(v)
    return v
  } catch {
    return '[]'
  }
}

async function main() {
  console.log('Reading sso_db.sql...')
  const dump = fs.readFileSync(sqlPath, 'utf8')

  const clients = parseCopy(dump, 'oidc_clients')
  console.log(`Parsed: ${clients.length} OIDC clients`)

  if (clients.length === 0) {
    console.error('No OIDC clients found in sso_db.sql')
    process.exit(1)
  }

  const sql = postgres(DATABASE_URL, { max: 1 })

  try {
    console.log('\nImporting OIDC clients...')
    let imported = 0
    let skipped = 0

    for (const row of clients) {
      // Kolom sesuai urutan di COPY: id, client_id, client_secret_hash, name, description, site_id,
      // redirect_uris, post_logout_redirect_uris, grant_types, response_types, scopes,
      // token_endpoint_auth_method, is_first_party, require_access_grant, is_active, created_at, updated_at
      const [
        id,
        clientId,
        clientSecretHash,
        name,
        description,
        siteId,
        redirectUris,
        postLogoutRedirectUris,
        grantTypes,
        responseTypes,
        scopes,
        tokenEndpointAuthMethod,
        isFirstParty,
        requireAccessGrant,
        isActive,
        createdAt,
        updatedAt,
      ] = row

      try {
        await sql`
          INSERT INTO oidc_clients (
            id, client_id, client_secret_hash, name, description, site_id,
            redirect_uris, post_logout_redirect_uris, grant_types, response_types,
            scopes, token_endpoint_auth_method, is_first_party, require_access_grant,
            is_active, created_at, updated_at
          ) VALUES (
            ${id},
            ${clientId},
            ${clientSecretHash},
            ${name},
            ${description},
            ${siteId},
            ${sql.json(JSON.parse(parseJson(redirectUris)))},
            ${sql.json(JSON.parse(parseJson(postLogoutRedirectUris)))},
            ${sql.json(JSON.parse(parseJson(grantTypes)))},
            ${sql.json(JSON.parse(parseJson(responseTypes)))},
            ${sql.json(JSON.parse(parseJson(scopes)))},
            ${tokenEndpointAuthMethod},
            ${isFirstParty === 't'},
            ${requireAccessGrant === 't'},
            ${isActive === 't'},
            ${createdAt},
            ${updatedAt}
          )
          ON CONFLICT (client_id) DO UPDATE SET
            id = EXCLUDED.id,
            client_secret_hash = EXCLUDED.client_secret_hash,
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            site_id = EXCLUDED.site_id,
            redirect_uris = EXCLUDED.redirect_uris,
            post_logout_redirect_uris = EXCLUDED.post_logout_redirect_uris,
            grant_types = EXCLUDED.grant_types,
            response_types = EXCLUDED.response_types,
            scopes = EXCLUDED.scopes,
            token_endpoint_auth_method = EXCLUDED.token_endpoint_auth_method,
            is_first_party = EXCLUDED.is_first_party,
            require_access_grant = EXCLUDED.require_access_grant,
            is_active = EXCLUDED.is_active,
            updated_at = EXCLUDED.updated_at
        `
        console.log(`  + ${name} (${clientId})`)
        imported++
      } catch (err) {
        console.error(`  x ${name}: ${err.message}`)
        skipped++
      }
    }

    const [{ count }] = await sql`SELECT count(*)::int AS count FROM oidc_clients`

    console.log(`\nDone. Imported: ${imported}, skipped: ${skipped}`)
    console.log(`Total oidc_clients in DB: ${count}`)
  } finally {
    await sql.end({ timeout: 5 })
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
