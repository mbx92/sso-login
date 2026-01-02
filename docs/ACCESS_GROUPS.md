# Access Groups - Group-based Access Control

## Overview

Fitur Access Groups memungkinkan Anda untuk mengatur akses user ke OIDC clients melalui group. Setiap group dapat berisi banyak user dan banyak aplikasi (clients). User yang merupakan member dari group akan otomatis mendapatkan akses ke semua aplikasi yang ada di group tersebut.

## Features

1. **Group Management**: Buat, edit, dan hapus access groups
2. **User Mapping**: Tambahkan atau hapus user dari group
3. **Client Mapping**: Tambahkan atau hapus aplikasi/client dari group
4. **Access Control**: Sistem otomatis check akses berdasarkan group membership atau direct access

## How It Works

### Access Check Priority

Ketika user mencoba mengakses sebuah OIDC client, sistem akan melakukan pengecekan dengan urutan:

1. **Client Access Requirement Check**
   - Jika client tidak require access grant (`requireAccessGrant = false`), user langsung mendapat akses
   - Jika require access grant, lanjut ke step 2

2. **Direct Access Check**
   - Sistem check apakah user memiliki direct access ke client tersebut (dari tabel `user_app_access`)
   - Jika ya, user mendapat akses
   - Jika tidak, lanjut ke step 3

3. **Group-based Access Check**
   - Sistem mencari semua group yang user ikuti
   - Untuk setiap group, check apakah client ada dalam group tersebut
   - Jika ditemukan, user mendapat akses
   - Jika tidak, tampilkan halaman Access Denied

### Database Schema

#### access_groups
```sql
- id: uuid (PK)
- name: varchar(255)
- description: text
- site_id: uuid (FK to sites)
- is_active: boolean
- created_by: uuid (FK to users)
- created_at: timestamp
- updated_at: timestamp
```

#### access_group_users
```sql
- id: uuid (PK)
- group_id: uuid (FK to access_groups)
- user_id: uuid (FK to users)
- added_by: uuid (FK to users)
- added_at: timestamp
```

#### access_group_clients
```sql
- id: uuid (PK)
- group_id: uuid (FK to access_groups)
- client_id: uuid (FK to oidc_clients)
- added_by: uuid (FK to users)
- added_at: timestamp
```

## Usage Example

### Scenario: Finance Department

1. Buat group baru dengan nama "Finance Department"
2. Tambahkan semua user dari department finance ke group
3. Tambahkan aplikasi-aplikasi yang boleh diakses finance:
   - Accounting System
   - Budget Management
   - Expense Tracker
4. Setiap user di group otomatis mendapat akses ke ketiga aplikasi tersebut

### Scenario: Personal Access

1. Buat group dengan nama "Personal - John Doe"
2. Tambahkan user "John Doe" ke group
3. Tambahkan aplikasi khusus yang hanya John yang boleh akses:
   - Executive Dashboard
   - HR Admin Panel
4. John mendapat akses ke aplikasi-aplikasi tersebut

## API Endpoints

### Groups Management

- `GET /api/admin/access-groups` - List all groups
- `POST /api/admin/access-groups` - Create new group
- `PUT /api/admin/access-groups/:id` - Update group
- `DELETE /api/admin/access-groups/:id` - Delete group
- `GET /api/admin/access-groups/:id/details` - Get group details (users & clients)

### Group Members Management

- `POST /api/admin/access-groups/:id/users` - Add user to group
- `DELETE /api/admin/access-groups/:id/users/:userId` - Remove user from group
- `POST /api/admin/access-groups/:id/clients` - Add client to group
- `DELETE /api/admin/access-groups/:id/clients/:clientId` - Remove client from group

## UI

Halaman User Access (`/admin/user-access`) menampilkan:

1. **Groups Grid** - Card-based display untuk semua groups
2. **Group Details Modal** - Menampilkan detail group dengan list users dan clients
3. **Add User/Client Modal** - Form untuk menambah user atau client ke group
4. **Delete Confirmation** - Confirmation modal sebelum delete group

## Migration

Untuk menerapkan fitur ini ke database:

```bash
# Jalankan migration
psql -U username -d sso_db -f server/db/migrations/0003_add_access_groups.sql
```

Atau jika menggunakan drizzle:

```bash
npm run db:push
```

## Access Control Utility

File `server/utils/access-control.ts` berisi helper functions:

- `checkUserClientAccess(userId, clientId)` - Check apakah user punya akses ke client
- `getUserAccessibleClients(userId)` - Get semua client IDs yang user bisa akses

Functions ini digunakan di `server/api/oidc/authorize.get.ts` untuk enforce access control.

## Notes

- Groups bersifat **additive** - user bisa punya akses via direct grant DAN group membership
- Satu user bisa menjadi member dari multiple groups
- Satu client bisa ada di multiple groups
- Menghapus group akan otomatis menghapus semua user dan client mappings (cascade delete)
- Sistem tetap support direct user-to-client access grant via tabel `user_app_access`
