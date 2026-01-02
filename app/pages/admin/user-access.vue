<template>
  <NuxtLayout name="admin">
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">User Access Groups</h1>
          <p class="text-sm text-gray-500 mt-1">Kelola akses user ke aplikasi melalui group</p>
        </div>
        <button
          @click="showCreateGroupModal = true"
          class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Buat Group
        </button>
      </div>

      <!-- Groups List -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <!-- Loading State -->
        <div v-if="loading" class="p-8 text-center">
          <svg class="animate-spin w-8 h-8 mx-auto text-emerald-500" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="mt-2 text-gray-500">Loading groups...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="groups.length === 0" class="p-8 text-center">
          <svg class="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Belum ada group</h3>
          <p class="text-gray-500 mb-4">Buat group untuk mengatur akses user ke aplikasi</p>
        </div>

        <!-- Groups Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          <div
            v-for="group in groups"
            :key="group.id"
            class="border border-gray-200 rounded-lg p-4 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
            @click="viewGroupDetails(group)"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-2">
                <div class="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900">{{ group.name }}</h3>
                  <span v-if="!group.isActive" class="text-xs text-gray-500">(Inactive)</span>
                </div>
              </div>
              <button
                @click.stop="deleteGroup(group)"
                class="text-gray-400 hover:text-red-600 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            
            <p v-if="group.description" class="text-sm text-gray-600 mb-3">{{ group.description }}</p>
            
            <div class="flex items-center gap-4 text-sm">
              <div class="flex items-center gap-1 text-gray-600">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{{ group.usersCount }} users</span>
              </div>
              <div class="flex items-center gap-1 text-gray-600">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{{ group.clientsCount }} apps</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Create Group Modal -->
      <div v-if="showCreateGroupModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="showCreateGroupModal = false"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Buat Group Baru</h3>
          </div>
          <form @submit.prevent="createGroup" class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Nama Group *</label>
              <input
                v-model="groupForm.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Contoh: Personal, Finance, HR"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
              <textarea
                v-model="groupForm.description"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Deskripsi singkat tentang group ini"
              ></textarea>
            </div>
            
            <!-- Bulk Add Users -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Tambah Users (Opsional)
                <span class="text-xs text-gray-500 font-normal ml-1">- {{ groupForm.selectedUsers.length }} dipilih</span>
              </label>
              <button
                type="button"
                @click="openBulkUserSelector"
                class="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-left"
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">
                    {{ groupForm.selectedUsers.length > 0 ? `${groupForm.selectedUsers.length} user dipilih` : 'Klik untuk pilih users secara bulk' }}
                  </span>
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
            
            <!-- Bulk Add Clients -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Tambah Aplikasi (Opsional)
                <span class="text-xs text-gray-500 font-normal ml-1">- {{ groupForm.selectedClients.length }} dipilih</span>
              </label>
              <button
                type="button"
                @click="openBulkClientSelector"
                class="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-left"
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">
                    {{ groupForm.selectedClients.length > 0 ? `${groupForm.selectedClients.length} aplikasi dipilih` : 'Klik untuk pilih aplikasi secara bulk' }}
                  </span>
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>

            <div class="flex gap-3 pt-4">
              <button
                type="button"
                @click="cancelCreateGroup"
                class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="saving || !groupForm.name"
                class="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {{ saving ? 'Creating...' : 'Buat Group' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Group Details Modal -->
      <div v-if="showDetailsModal && selectedGroup" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="showDetailsModal = false"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div class="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">{{ selectedGroup.name }}</h3>
              <button @click="showDetailsModal = false" class="text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p v-if="selectedGroup.description" class="text-sm text-gray-600 mt-1">{{ selectedGroup.description }}</p>
          </div>
          
          <div class="p-6 space-y-6">
            <!-- Users Section -->
            <div>
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-md font-semibold text-gray-900">Users ({{ groupDetails.users.length }})</h4>
                <button
                  @click="showAddUserModal = true"
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah User
                </button>
              </div>
              
              <div v-if="groupDetails.users.length === 0" class="text-center py-8 bg-gray-50 rounded-lg">
                <p class="text-gray-500">Belum ada user dalam group ini</p>
              </div>
              
              <div v-else class="max-h-96 overflow-y-auto space-y-2 pr-2">
                <div
                  v-for="user in groupDetails.users"
                  :key="user.id"
                  class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <span class="text-emerald-700 text-sm font-medium">{{ (user.userName || '?')[0].toUpperCase() }}</span>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900">{{ user.userName || '-' }}</p>
                      <p class="text-xs text-gray-500">{{ user.userEmail || '-' }}</p>
                    </div>
                  </div>
                  <button
                    @click="confirmRemoveUser(user)"
                    class="text-red-600 hover:text-red-800 text-sm flex-shrink-0"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>

            <!-- Clients Section -->
            <div>
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-md font-semibold text-gray-900">Aplikasi ({{ groupDetails.clients.length }})</h4>
                <button
                  @click="showAddClientModal = true"
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah Aplikasi
                </button>
              </div>
              
              <div v-if="groupDetails.clients.length === 0" class="text-center py-8 bg-gray-50 rounded-lg">
                <p class="text-gray-500">Belum ada aplikasi dalam group ini</p>
              </div>
              
              <div v-else class="max-h-96 overflow-y-auto space-y-2 pr-2">
                <div
                  v-for="client in groupDetails.clients"
                  :key="client.id"
                  class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ client.clientName || '-' }}</p>
                    <p v-if="client.clientDescription" class="text-xs text-gray-500">{{ client.clientDescription }}</p>
                  </div>
                  <button
                    @click="confirmRemoveClient(client)"
                    class="text-red-600 hover:text-red-800 text-sm flex-shrink-0"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add User to Group Modal -->
      <div v-if="showAddUserModal && selectedGroup" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="showAddUserModal = false"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Tambah User ke Group</h3>
          </div>
          <form @submit.prevent="addUserToGroup" class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">User</label>
              <UInputMenu
                v-model="selectedUserToAdd"
                v-model:search-term="userSearchTerm"
                :items="userItems"
                :loading="isSearching"
                ignore-filter
                placeholder="Ketik nama, email, atau NIP..."
                icon="i-lucide-user"
                :filter-fields="['label', 'email', 'employeeId']"
                class="w-full"
                value-key="id"
              >
                <template #item-label="{ item }">
                  <div class="flex flex-col">
                    <span>{{ item.label }}</span>
                    <span class="text-xs text-gray-500">{{ item.email }}{{ item.employeeId ? ` • ${item.employeeId}` : '' }}</span>
                  </div>
                </template>
              </UInputMenu>
            </div>
            <div class="flex gap-3 pt-4">
              <button
                type="button"
                @click="showAddUserModal = false"
                class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="saving || !selectedUserToAdd"
                class="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                Tambah
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Add Client to Group Modal -->
      <div v-if="showAddClientModal && selectedGroup" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="showAddClientModal = false"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Tambah Aplikasi ke Group</h3>
          </div>
          <form @submit.prevent="addClientToGroup" class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Aplikasi</label>
              <USelect
                v-model="selectedClientToAdd"
                :items="clientItems"
                placeholder="Pilih aplikasi..."
                value-key="value"
                class="w-full"
              />
            </div>
            <div class="flex gap-3 pt-4">
              <button
                type="button"
                @click="showAddClientModal = false"
                class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="saving || !selectedClientToAdd"
                class="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                Tambah
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete Group Confirmation Modal -->
      <ConfirmModal
        :isOpen="showDeleteModal"
        title="Hapus Group"
        :message="`Apakah Anda yakin ingin menghapus group '${groupToDelete?.name}'? Tindakan ini tidak dapat dibatalkan.`"
        type="danger"
        confirmText="Hapus"
        cancelText="Batal"
        @confirm="doDeleteGroup"
        @cancel="showDeleteModal = false"
      />

      <!-- Delete User Confirmation Modal -->
      <ConfirmModal
        :isOpen="showDeleteUserModal"
        title="Hapus User dari Group"
        :message="`Apakah Anda yakin ingin menghapus '${userToDelete?.userName}' dari group ini?`"
        type="danger"
        confirmText="Hapus"
        cancelText="Batal"
        @confirm="doRemoveUserFromGroup"
        @cancel="cancelRemoveUser"
      />

      <!-- Delete Client Confirmation Modal -->
      <ConfirmModal
        :isOpen="showDeleteClientModal"
        title="Hapus Aplikasi dari Group"
        :message="`Apakah Anda yakin ingin menghapus aplikasi '${clientToDelete?.clientName}' dari group ini?`"
        type="danger"
        confirmText="Hapus"
        cancelText="Batal"
        @confirm="doRemoveClientFromGroup"
        @cancel="cancelRemoveClient"
      />

      <!-- Bulk User Selector Modal -->
      <div v-if="showBulkUserSelector" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="closeBulkUserSelector"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Pilih Users untuk Group</h3>
            <p class="text-sm text-gray-500 mt-1">Pilih user dari kiri, lalu klik tombol untuk pindahkan ke kanan</p>
          </div>
          
          <div class="flex-1 overflow-hidden p-6 min-h-0">
            <div class="grid grid-cols-2 gap-6 h-full">
              <!-- Available Users (Left) -->
              <div class="flex flex-col border border-gray-200 rounded-lg h-full overflow-hidden">
                <div class="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                  <h4 class="font-medium text-gray-900 mb-3">Tersedia ({{ filteredAvailableUsers.length }})</h4>
                  <input
                    v-model="availableUserSearch"
                    type="text"
                    placeholder="Cari user..."
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <div class="mt-2 flex gap-2">
                    <button
                      type="button"
                      @click="selectAllAvailableUsers"
                      class="text-xs px-2 py-1 text-emerald-600 hover:bg-emerald-50 rounded"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      @click="deselectAllAvailableUsers"
                      class="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div class="flex-1 overflow-y-auto p-2">
                  <div
                    v-for="user in filteredAvailableUsers"
                    :key="user.id"
                    @click="toggleAvailableUser(user.id)"
                    class="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                    :class="{ 'bg-emerald-50 border-2 border-emerald-500': tempSelectedAvailable.has(user.id) }"
                  >
                    <input
                      type="checkbox"
                      :checked="tempSelectedAvailable.has(user.id)"
                      class="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      @click.stop
                    />
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">{{ user.name }}</p>
                      <p class="text-xs text-gray-500 truncate">{{ user.email }}</p>
                    </div>
                  </div>
                  <div v-if="filteredAvailableUsers.length === 0" class="text-center py-8 text-gray-500 text-sm">
                    {{ availableUserSearch ? 'Tidak ada user yang cocok' : 'Semua user sudah dipilih' }}
                  </div>
                </div>
              </div>

              <!-- Transfer Buttons (Middle) -->
              <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col gap-3">
                <button
                  type="button"
                  @click="moveUsersToSelected"
                  :disabled="tempSelectedAvailable.size === 0"
                  class="p-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  title="Pindah ke kanan"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  @click="moveUsersToAvailable"
                  :disabled="tempSelectedChosen.size === 0"
                  class="p-3 bg-gray-600 text-white rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  title="Pindah ke kiri"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>

              <!-- Selected Users (Right) -->
              <div class="flex flex-col border border-gray-200 rounded-lg h-full overflow-hidden">
                <div class="p-4 border-b border-gray-200 bg-emerald-50 flex-shrink-0">
                  <h4 class="font-medium text-gray-900 mb-3">Dipilih ({{ filteredChosenUsers.length }})</h4>
                  <input
                    v-model="chosenUserSearch"
                    type="text"
                    placeholder="Cari user..."
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <div class="mt-2 flex gap-2">
                    <button
                      type="button"
                      @click="selectAllChosenUsers"
                      class="text-xs px-2 py-1 text-emerald-600 hover:bg-emerald-100 rounded"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      @click="deselectAllChosenUsers"
                      class="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div class="flex-1 overflow-y-auto p-2">
                  <div
                    v-for="user in filteredChosenUsers"
                    :key="user.id"
                    @click="toggleChosenUser(user.id)"
                    class="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                    :class="{ 'bg-emerald-50 border-2 border-emerald-500': tempSelectedChosen.has(user.id) }"
                  >
                    <input
                      type="checkbox"
                      :checked="tempSelectedChosen.has(user.id)"
                      class="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      @click.stop
                    />
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">{{ user.name }}</p>
                      <p class="text-xs text-gray-500 truncate">{{ user.email }}</p>
                    </div>
                  </div>
                  <div v-if="filteredChosenUsers.length === 0" class="text-center py-8 text-gray-500 text-sm">
                    {{ chosenUserSearch ? 'Tidak ada user yang cocok' : 'Belum ada user dipilih' }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="px-6 py-4 border-t border-gray-200 flex gap-3">
            <button
              type="button"
              @click="closeBulkUserSelector"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="button"
              @click="confirmBulkUserSelection"
              class="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Konfirmasi ({{ tempChosenUserIds.size }} user)
            </button>
          </div>
        </div>
      </div>

      <!-- Bulk Client Selector Modal -->
      <div v-if="showBulkClientSelector" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="closeBulkClientSelector"></div>
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Pilih Aplikasi untuk Group</h3>
            <p class="text-sm text-gray-500 mt-1">Pilih aplikasi dari kiri, lalu klik tombol untuk pindahkan ke kanan</p>
          </div>
          
          <div class="flex-1 overflow-hidden p-6 min-h-0">
            <div class="grid grid-cols-2 gap-6 h-full">
              <!-- Available Clients (Left) -->
              <div class="flex flex-col border border-gray-200 rounded-lg h-full overflow-hidden">
                <div class="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                  <h4 class="font-medium text-gray-900 mb-3">Tersedia ({{ filteredAvailableClients.length }})</h4>
                  <input
                    v-model="availableClientSearch"
                    type="text"
                    placeholder="Cari aplikasi..."
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <div class="mt-2 flex gap-2">
                    <button
                      type="button"
                      @click="selectAllAvailableClients"
                      class="text-xs px-2 py-1 text-emerald-600 hover:bg-emerald-50 rounded"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      @click="deselectAllAvailableClients"
                      class="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div class="flex-1 overflow-y-auto p-2">
                  <div
                    v-for="client in filteredAvailableClients"
                    :key="client.id"
                    @click="toggleAvailableClient(client.id)"
                    class="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                    :class="{ 'bg-emerald-50 border-2 border-emerald-500': tempSelectedAvailableClients.has(client.id) }"
                  >
                    <input
                      type="checkbox"
                      :checked="tempSelectedAvailableClients.has(client.id)"
                      class="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      @click.stop
                    />
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">{{ client.clientName || client.name || client.clientId }}</p>
                      <p v-if="client.clientDescription" class="text-xs text-gray-500 truncate">{{ client.clientDescription }}</p>
                    </div>
                  </div>
                  <div v-if="filteredAvailableClients.length === 0" class="text-center py-8 text-gray-500 text-sm">
                    {{ availableClientSearch ? 'Tidak ada aplikasi yang cocok' : 'Semua aplikasi sudah dipilih' }}
                  </div>
                </div>
              </div>

              <!-- Transfer Buttons (Middle) -->
              <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col gap-3">
                <button
                  type="button"
                  @click="moveClientsToSelected"
                  :disabled="tempSelectedAvailableClients.size === 0"
                  class="p-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  title="Pindah ke kanan"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  @click="moveClientsToAvailable"
                  :disabled="tempSelectedChosenClients.size === 0"
                  class="p-3 bg-gray-600 text-white rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  title="Pindah ke kiri"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>

              <!-- Selected Clients (Right) -->
              <div class="flex flex-col border border-gray-200 rounded-lg h-full overflow-hidden">
                <div class="p-4 border-b border-gray-200 bg-emerald-50 flex-shrink-0">
                  <h4 class="font-medium text-gray-900 mb-3">Dipilih ({{ filteredChosenClients.length }})</h4>
                  <input
                    v-model="chosenClientSearch"
                    type="text"
                    placeholder="Cari aplikasi..."
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <div class="mt-2 flex gap-2">
                    <button
                      type="button"
                      @click="selectAllChosenClients"
                      class="text-xs px-2 py-1 text-emerald-600 hover:bg-emerald-100 rounded"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      @click="deselectAllChosenClients"
                      class="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div class="flex-1 overflow-y-auto p-2">
                  <div
                    v-for="client in filteredChosenClients"
                    :key="client.id"
                    @click="toggleChosenClient(client.id)"
                    class="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                    :class="{ 'bg-emerald-50 border-2 border-emerald-500': tempSelectedChosenClients.has(client.id) }"
                  >
                    <input
                      type="checkbox"
                      :checked="tempSelectedChosenClients.has(client.id)"
                      class="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      @click.stop
                    />
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">{{ client.clientName || client.name || client.clientId }}</p>
                      <p v-if="client.clientDescription" class="text-xs text-gray-500 truncate">{{ client.clientDescription }}</p>
                    </div>
                  </div>
                  <div v-if="filteredChosenClients.length === 0" class="text-center py-8 text-gray-500 text-sm">
                    {{ chosenClientSearch ? 'Tidak ada aplikasi yang cocok' : 'Belum ada aplikasi dipilih' }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="px-6 py-4 border-t border-gray-200 flex gap-3">
            <button
              type="button"
              @click="closeBulkClientSelector"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="button"
              @click="confirmBulkClientSelection"
              class="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Konfirmasi ({{ tempChosenClientIds.size }} aplikasi)
            </button>
          </div>
        </div>
      </div>

      <!-- Error Modal -->
      <ErrorModal
        :isOpen="showErrorModal"
        :title="errorTitle"
        :message="errorMessage"
        type="error"
        @close="showErrorModal = false"
      />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { refDebounced } from '@vueuse/core'

definePageMeta({
  middleware: ['auth']
})

interface AccessGroup {
  id: string
  name: string
  description: string | null
  siteId: string | null
  isActive: boolean
  createdBy: string | null
  createdAt: string
  updatedAt: string
  usersCount: number
  clientsCount: number
}

interface GroupUser {
  id: string
  userId: string
  userName: string | null
  userEmail: string | null
  userDepartment: string | null
  userEmployeeId: string | null
  addedBy: string | null
  addedAt: string
}

interface GroupClient {
  id: string
  clientId: string
  clientName: string | null
  clientDescription: string | null
  clientIsActive: boolean
  addedBy: string | null
  addedAt: string
}

interface UserItem {
  id: string
  label: string
  email: string
  employeeId: string | null
  value?: string  // For UInputMenu multiple selection
}

const groups = ref<AccessGroup[]>([])
const clients = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)

const showCreateGroupModal = ref(false)
const showDetailsModal = ref(false)
const showAddUserModal = ref(false)
const showAddClientModal = ref(false)
const showDeleteModal = ref(false)
const showDeleteUserModal = ref(false)
const showDeleteClientModal = ref(false)
const showErrorModal = ref(false)
const showBulkUserSelector = ref(false)
const showBulkClientSelector = ref(false)

const errorTitle = ref('Error')
const errorMessage = ref('')

// Bulk user selector state
const allUsers = ref<any[]>([])
const tempChosenUserIds = ref(new Set<string>())
const tempSelectedAvailable = ref(new Set<string>())
const tempSelectedChosen = ref(new Set<string>())
const availableUserSearch = ref('')
const chosenUserSearch = ref('')

// Bulk client selector state
const tempChosenClientIds = ref(new Set<string>())
const tempSelectedAvailableClients = ref(new Set<string>())
const tempSelectedChosenClients = ref(new Set<string>())
const availableClientSearch = ref('')
const chosenClientSearch = ref('')

const selectedGroup = ref<AccessGroup | null>(null)
const groupToDelete = ref<AccessGroup | null>(null)
const userToDelete = ref<GroupUser | null>(null)
const clientToDelete = ref<GroupClient | null>(null)

const groupDetails = ref<{
  users: GroupUser[]
  clients: GroupClient[]
}>({
  users: [],
  clients: []
})

const groupForm = ref({
  name: '',
  description: '',
  selectedUsers: [] as string[],
  selectedClients: [] as string[]
})

// Bulk user search for create group modal
const bulkUserSearchTerm = ref('')
const bulkUserSearchTermDebounced = refDebounced(bulkUserSearchTerm, 300)
const bulkUserItems = ref<UserItem[]>([])
const isBulkSearching = ref(false)

// User search
const userSearchTerm = ref('')
const userSearchTermDebounced = refDebounced(userSearchTerm, 300)
const userItems = ref<UserItem[]>([])
const selectedUserToAdd = ref<UserItem | null>(null)
const isSearching = ref(false)

// Client selection
const selectedClientToAdd = ref('')

const clientItems = computed(() => {
  return clients.value.map(client => ({
    label: client.clientName || client.name || client.clientId,
    value: client.id
  }))
})

// Watch debounced search term for bulk user search
watch(bulkUserSearchTermDebounced, async (searchTerm) => {
  if (!searchTerm || searchTerm.length < 2) {
    bulkUserItems.value = []
    isBulkSearching.value = false
    return
  }
  
  isBulkSearching.value = true
  try {
    const res = await $fetch(`/api/admin/users?search=${encodeURIComponent(searchTerm)}&limit=20`)
    const users = (res as any).data || []
    bulkUserItems.value = users.map((user: any) => ({
      id: user.id,
      label: user.name,
      email: user.email,
      employeeId: user.employeeId,
      value: user.id
    }))
  } catch (error) {
    console.error('Bulk search error:', error)
    bulkUserItems.value = []
  } finally {
    isBulkSearching.value = false
  }
})

// Watch debounced search term for add user modal
watch(userSearchTermDebounced, async (searchTerm) => {
  if (!searchTerm || searchTerm.length < 2) {
    userItems.value = []
    isSearching.value = false
    return
  }
  
  isSearching.value = true
  try {
    const res = await $fetch(`/api/admin/users?search=${encodeURIComponent(searchTerm)}&limit=10`)
    const users = (res as any).data || []
    userItems.value = users.map((user: any) => ({
      id: user.id,
      label: user.name,
      email: user.email,
      employeeId: user.employeeId
    }))
  } catch (error) {
    console.error('Search error:', error)
    userItems.value = []
  } finally {
    isSearching.value = false
  }
})

// Computed properties for bulk user selector
const filteredAvailableUsers = computed(() => {
  const available = allUsers.value.filter(user => !tempChosenUserIds.value.has(user.id))
  if (!availableUserSearch.value) return available
  
  const search = availableUserSearch.value.toLowerCase()
  return available.filter(user => 
    user.name?.toLowerCase().includes(search) || 
    user.email?.toLowerCase().includes(search) ||
    user.employeeId?.toLowerCase().includes(search)
  )
})

const filteredChosenUsers = computed(() => {
  const chosen = allUsers.value.filter(user => tempChosenUserIds.value.has(user.id))
  if (!chosenUserSearch.value) return chosen
  
  const search = chosenUserSearch.value.toLowerCase()
  return chosen.filter(user => 
    user.name?.toLowerCase().includes(search) || 
    user.email?.toLowerCase().includes(search) ||
    user.employeeId?.toLowerCase().includes(search)
  )
})

// Computed properties for bulk client selector
const filteredAvailableClients = computed(() => {
  const available = clients.value.filter(client => !tempChosenClientIds.value.has(client.id))
  if (!availableClientSearch.value) return available
  
  const search = availableClientSearch.value.toLowerCase()
  return available.filter(client => 
    (client.clientName || client.name || client.clientId || '').toLowerCase().includes(search) ||
    (client.clientDescription || '').toLowerCase().includes(search)
  )
})

const filteredChosenClients = computed(() => {
  const chosen = clients.value.filter(client => tempChosenClientIds.value.has(client.id))
  if (!chosenClientSearch.value) return chosen
  
  const search = chosenClientSearch.value.toLowerCase()
  return chosen.filter(client => 
    (client.clientName || client.name || client.clientId || '').toLowerCase().includes(search) ||
    (client.clientDescription || '').toLowerCase().includes(search)
  )
})

async function loadGroups() {
  loading.value = true
  try {
    const [groupsRes, clientsRes] = await Promise.all([
      $fetch('/api/admin/access-groups'),
      $fetch('/api/admin/clients')
    ])
    
    groups.value = (groupsRes as any).data || []
    clients.value = (clientsRes as any).data || (clientsRes as any).clients || []
  } catch (error) {
    console.error('Failed to load groups:', error)
  } finally {
    loading.value = false
  }
}

async function createGroup() {
  saving.value = true
  try {
    const response = await $fetch('/api/admin/access-groups', {
      method: 'POST',
      body: {
        name: groupForm.value.name,
        description: groupForm.value.description
      }
    })
    
    const newGroup = (response as any).data
    
    // Bulk add users if selected
    if (groupForm.value.selectedUsers.length > 0) {
      await Promise.all(
        groupForm.value.selectedUsers.map(userId =>
          $fetch(`/api/admin/access-groups/${newGroup.id}/users`, {
            method: 'POST',
            body: { userId }
          }).catch(err => console.error('Failed to add user:', userId, err))
        )
      )
    }
    
    // Bulk add clients if selected
    if (groupForm.value.selectedClients.length > 0) {
      await Promise.all(
        groupForm.value.selectedClients.map(clientId =>
          $fetch(`/api/admin/access-groups/${newGroup.id}/clients`, {
            method: 'POST',
            body: { clientId }
          }).catch(err => console.error('Failed to add client:', clientId, err))
        )
      )
    }
    
    showCreateGroupModal.value = false
    groupForm.value = { 
      name: '', 
      description: '',
      selectedUsers: [],
      selectedClients: []
    }
    bulkUserSearchTerm.value = ''
    bulkUserItems.value = []
    await loadGroups()
  } catch (error: any) {
    console.error('Failed to create group:', error)
    errorTitle.value = 'Gagal Membuat Group'
    errorMessage.value = error.data?.message || error.message || 'Terjadi kesalahan saat membuat group'
    showErrorModal.value = true
  } finally {
    saving.value = false
  }
}

function cancelCreateGroup() {
  showCreateGroupModal.value = false
  groupForm.value = { 
    name: '', 
    description: '',
    selectedUsers: [],
    selectedClients: []
  }
  bulkUserSearchTerm.value = ''
  bulkUserItems.value = []
}

// Bulk User Selector Functions
async function openBulkUserSelector() {
  showBulkUserSelector.value = true
  
  // Load all users if not loaded yet
  if (allUsers.value.length === 0) {
    try {
      const res = await $fetch('/api/admin/users?limit=5000')
      allUsers.value = (res as any).data || []
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }
  
  // Initialize temp selection with current selection
  tempChosenUserIds.value = new Set(groupForm.value.selectedUsers)
  tempSelectedAvailable.value = new Set()
  tempSelectedChosen.value = new Set()
  availableUserSearch.value = ''
  chosenUserSearch.value = ''
}

function closeBulkUserSelector() {
  showBulkUserSelector.value = false
  tempChosenUserIds.value = new Set()
  tempSelectedAvailable.value = new Set()
  tempSelectedChosen.value = new Set()
}

function toggleAvailableUser(userId: string) {
  if (tempSelectedAvailable.value.has(userId)) {
    tempSelectedAvailable.value.delete(userId)
  } else {
    tempSelectedAvailable.value.add(userId)
  }
}

function toggleChosenUser(userId: string) {
  if (tempSelectedChosen.value.has(userId)) {
    tempSelectedChosen.value.delete(userId)
  } else {
    tempSelectedChosen.value.add(userId)
  }
}

function selectAllAvailableUsers() {
  filteredAvailableUsers.value.forEach(user => {
    tempSelectedAvailable.value.add(user.id)
  })
}

function deselectAllAvailableUsers() {
  tempSelectedAvailable.value.clear()
}

function selectAllChosenUsers() {
  filteredChosenUsers.value.forEach(user => {
    tempSelectedChosen.value.add(user.id)
  })
}

function deselectAllChosenUsers() {
  tempSelectedChosen.value.clear()
}

function moveUsersToSelected() {
  tempSelectedAvailable.value.forEach(userId => {
    tempChosenUserIds.value.add(userId)
  })
  tempSelectedAvailable.value.clear()
}

function moveUsersToAvailable() {
  tempSelectedChosen.value.forEach(userId => {
    tempChosenUserIds.value.delete(userId)
  })
  tempSelectedChosen.value.clear()
}

function confirmBulkUserSelection() {
  groupForm.value.selectedUsers = Array.from(tempChosenUserIds.value)
  closeBulkUserSelector()
}

// Bulk Client Selector Functions
async function openBulkClientSelector() {
  showBulkClientSelector.value = true
  
  // Initialize temp selection with current selection
  tempChosenClientIds.value = new Set(groupForm.value.selectedClients)
  tempSelectedAvailableClients.value = new Set()
  tempSelectedChosenClients.value = new Set()
  availableClientSearch.value = ''
  chosenClientSearch.value = ''
}

function closeBulkClientSelector() {
  showBulkClientSelector.value = false
  tempChosenClientIds.value = new Set()
  tempSelectedAvailableClients.value = new Set()
  tempSelectedChosenClients.value = new Set()
}

function toggleAvailableClient(clientId: string) {
  if (tempSelectedAvailableClients.value.has(clientId)) {
    tempSelectedAvailableClients.value.delete(clientId)
  } else {
    tempSelectedAvailableClients.value.add(clientId)
  }
}

function toggleChosenClient(clientId: string) {
  if (tempSelectedChosenClients.value.has(clientId)) {
    tempSelectedChosenClients.value.delete(clientId)
  } else {
    tempSelectedChosenClients.value.add(clientId)
  }
}

function selectAllAvailableClients() {
  filteredAvailableClients.value.forEach(client => {
    tempSelectedAvailableClients.value.add(client.id)
  })
}

function deselectAllAvailableClients() {
  tempSelectedAvailableClients.value.clear()
}

function selectAllChosenClients() {
  filteredChosenClients.value.forEach(client => {
    tempSelectedChosenClients.value.add(client.id)
  })
}

function deselectAllChosenClients() {
  tempSelectedChosenClients.value.clear()
}

function moveClientsToSelected() {
  tempSelectedAvailableClients.value.forEach(clientId => {
    tempChosenClientIds.value.add(clientId)
  })
  tempSelectedAvailableClients.value.clear()
}

function moveClientsToAvailable() {
  tempSelectedChosenClients.value.forEach(clientId => {
    tempChosenClientIds.value.delete(clientId)
  })
  tempSelectedChosenClients.value.clear()
}

function confirmBulkClientSelection() {
  groupForm.value.selectedClients = Array.from(tempChosenClientIds.value)
  closeBulkClientSelector()
}

async function viewGroupDetails(group: AccessGroup) {
  selectedGroup.value = group
  showDetailsModal.value = true
  
  try {
    const res = await $fetch(`/api/admin/access-groups/${group.id}/details`)
    groupDetails.value = (res as any).data || { users: [], clients: [] }
  } catch (error) {
    console.error('Failed to load group details:', error)
  }
}

async function addUserToGroup() {
  if (!selectedUserToAdd.value || !selectedGroup.value) return
  
  saving.value = true
  try {
    // UInputMenu returns the value (UUID string), not the full object
    const userId = typeof selectedUserToAdd.value === 'string' 
      ? selectedUserToAdd.value 
      : (selectedUserToAdd.value as any).id
    
    await $fetch(`/api/admin/access-groups/${selectedGroup.value.id}/users`, {
      method: 'POST',
      body: {
        userId: userId
      }
    })
    
    showAddUserModal.value = false
    selectedUserToAdd.value = null
    userSearchTerm.value = ''
    userItems.value = []
    await viewGroupDetails(selectedGroup.value)
  } catch (error: any) {
    console.error('Failed to add user to group:', error)
    errorTitle.value = 'Gagal Menambah User'
    errorMessage.value = error.data?.message || error.message || 'Terjadi kesalahan saat menambahkan user ke group'
    showErrorModal.value = true
  } finally {
    saving.value = false
  }
}

function confirmRemoveUser(user: GroupUser) {
  userToDelete.value = user
  showDeleteUserModal.value = true
}

function cancelRemoveUser() {
  userToDelete.value = null
  showDeleteUserModal.value = false
}

async function doRemoveUserFromGroup() {
  if (!selectedGroup.value || !userToDelete.value) return
  
  saving.value = true
  try {
    await $fetch(`/api/admin/access-groups/${selectedGroup.value.id}/users/${userToDelete.value.id}`, {
      method: 'DELETE'
    })
    
    showDeleteUserModal.value = false
    userToDelete.value = null
    await viewGroupDetails(selectedGroup.value)
  } catch (error: any) {
    console.error('Failed to remove user from group:', error)
    errorTitle.value = 'Gagal Menghapus User'
    errorMessage.value = error.data?.message || error.message || 'Terjadi kesalahan saat menghapus user dari group'
    showErrorModal.value = true
  } finally {
    saving.value = false
  }
}

async function addClientToGroup() {
  if (!selectedClientToAdd.value || !selectedGroup.value) return
  
  saving.value = true
  try {
    await $fetch(`/api/admin/access-groups/${selectedGroup.value.id}/clients`, {
      method: 'POST',
      body: {
        clientId: selectedClientToAdd.value
      }
    })
    
    showAddClientModal.value = false
    selectedClientToAdd.value = ''
    await viewGroupDetails(selectedGroup.value)
  } catch (error: any) {
    console.error('Failed to add client to group:', error)
    errorTitle.value = 'Gagal Menambah Aplikasi'
    errorMessage.value = error.data?.message || error.message || 'Terjadi kesalahan saat menambahkan aplikasi ke group'
    showErrorModal.value = true
  } finally {
    saving.value = false
  }
}

function confirmRemoveClient(client: GroupClient) {
  clientToDelete.value = client
  showDeleteClientModal.value = true
}

function cancelRemoveClient() {
  clientToDelete.value = null
  showDeleteClientModal.value = false
}

async function doRemoveClientFromGroup() {
  if (!selectedGroup.value || !clientToDelete.value) return
  
  saving.value = true
  try {
    await $fetch(`/api/admin/access-groups/${selectedGroup.value.id}/clients/${clientToDelete.value.id}`, {
      method: 'DELETE'
    })
    
    showDeleteClientModal.value = false
    clientToDelete.value = null
    await viewGroupDetails(selectedGroup.value)
  } catch (error: any) {
    console.error('Failed to remove client from group:', error)
    errorTitle.value = 'Gagal Menghapus Aplikasi'
    errorMessage.value = error.data?.message || error.message || 'Terjadi kesalahan saat menghapus aplikasi dari group'
    showErrorModal.value = true
  } finally {
    saving.value = false
  }
}

function deleteGroup(group: AccessGroup) {
  groupToDelete.value = group
  showDeleteModal.value = true
}

async function doDeleteGroup() {
  if (!groupToDelete.value) return
  
  try {
    await $fetch(`/api/admin/access-groups/${groupToDelete.value.id}`, {
      method: 'DELETE'
    })
    
    showDeleteModal.value = false
    groupToDelete.value = null
    await loadGroups()
  } catch (error) {
    console.error('Failed to delete group:', error)
  }
}

onMounted(() => {
  loadGroups()
})
</script>
