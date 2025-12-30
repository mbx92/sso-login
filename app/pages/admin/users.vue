<template>
  <NuxtLayout name="admin">
    <div>
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Users</h1>
        <div class="flex gap-2">
          <input
            v-model="search"
            type="text"
            placeholder="Search users..."
            class="input input-bordered w-64"
            @keyup.enter="loadUsers"
          />
          <button @click="loadUsers" class="btn btn-ghost">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Info Alert -->
      <div class="alert alert-info mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Users are synced from HRIS. This view is read-only for MVP.</span>
      </div>

      <!-- Users Table -->
      <div class="card bg-base-100 shadow">
        <div class="card-body p-0">
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Employee ID</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Status</th>
                  <th>Role</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id">
                  <td>
                    <div class="flex items-center gap-3">
                      <div v-if="user.avatarUrl" class="avatar">
                        <div class="w-10 rounded-full">
                          <img :src="user.avatarUrl" :alt="user.name" />
                        </div>
                      </div>
                      <div v-else class="avatar placeholder">
                        <div class="bg-neutral text-neutral-content rounded-full w-10">
                          <span>{{ user.name.charAt(0).toUpperCase() }}</span>
                        </div>
                      </div>
                      <div>
                        <div class="font-bold">{{ user.name }}</div>
                      </div>
                    </div>
                  </td>
                  <td>{{ user.email }}</td>
                  <td>{{ user.employeeId || '-' }}</td>
                  <td>{{ user.department || '-' }}</td>
                  <td>{{ user.position || '-' }}</td>
                  <td>
                    <span
                      class="badge"
                      :class="user.status === 'active' ? 'badge-success' : 'badge-error'"
                    >
                      {{ user.status }}
                    </span>
                  </td>
                  <td>
                    <span v-if="user.roleName" class="badge badge-outline badge-sm">
                      {{ user.roleName }}
                    </span>
                    <span v-else>-</span>
                  </td>
                  <td class="text-sm text-base-content/60">
                    {{ formatDate(user.createdAt) }}
                  </td>
                </tr>
                <tr v-if="users.length === 0 && !loading">
                  <td colspan="8" class="text-center py-8 text-base-content/50">
                    No users found
                  </td>
                </tr>
                <tr v-if="loading">
                  <td colspan="8" class="text-center py-8">
                    <span class="loading loading-spinner loading-lg"></span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="flex justify-between items-center p-4 border-t">
            <div class="text-sm text-base-content/60">
              Showing {{ users.length }} of {{ pagination.total }} users
            </div>
            <div class="join">
              <button
                class="join-item btn btn-sm"
                :disabled="pagination.page <= 1"
                @click="changePage(pagination.page - 1)"
              >
                «
              </button>
              <button class="join-item btn btn-sm">
                Page {{ pagination.page }} of {{ pagination.totalPages }}
              </button>
              <button
                class="join-item btn btn-sm"
                :disabled="pagination.page >= pagination.totalPages"
                @click="changePage(pagination.page + 1)"
              >
                »
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: false
})

interface User {
  id: string
  email: string
  name: string
  employeeId: string | null
  status: string
  department: string | null
  position: string | null
  avatarUrl: string | null
  roleId: string | null
  roleName: string | null
  createdAt: string
}

const users = ref<User[]>([])
const loading = ref(false)
const search = ref('')
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
})

onMounted(() => {
  loadUsers()
})

async function loadUsers() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString()
    })
    if (search.value) {
      params.set('search', search.value)
    }

    const res = await $fetch(`/api/admin/users?${params}`)
    users.value = res.data
    pagination.value = res.pagination
  } catch (e) {
    console.error('Failed to load users:', e)
  } finally {
    loading.value = false
  }
}

function changePage(page: number) {
  pagination.value.page = page
  loadUsers()
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString()
}
</script>
