<template>
  <NuxtLayout name="admin">
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-ink">User Access Groups</h1>
          <p class="text-sm text-steel mt-1">Kelola akses user ke aplikasi melalui group</p>
        </div>
        <button
          @click="showCreateGroupModal = true"
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary active:bg-charcoal text-primary-foreground rounded-full transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Buat Group
        </button>
      </div>

      <!-- Groups List -->
      <div class="bg-canvas rounded-xl border border-hairline shadow-none overflow-hidden">
        <!-- Loading State -->
        <div v-if="loading" class="p-8 text-center">
          <svg class="animate-spin w-8 h-8 mx-auto text-ink" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="mt-2 text-steel">Loading groups...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="groups.length === 0" class="p-8 text-center">
          <svg class="w-12 h-12 mx-auto text-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 class="text-lg font-medium text-ink mb-2">Belum ada group</h3>
          <p class="text-steel mb-4">Buat group untuk mengatur akses user ke aplikasi</p>
        </div>

        <!-- Groups Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          <div
            v-for="group in groups"
            :key="group.id"
            class="border border-hairline rounded-lg p-4 active:border-ink hover:shadow-mm-1 transition-all cursor-pointer"
            :class="{ 'opacity-60': !group.isActive }"
            @click="viewGroupDetails(group)"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-2">
                <div class="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
                  <svg class="w-5 h-5 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-semibold text-ink">{{ group.name }}</h3>
                  <span class="text-xs text-steel">{{ group.isActive ? 'Aktif' : 'Nonaktif' }}</span>
                </div>
              </div>
              <div class="flex items-center gap-3" @click.stop>
                <Switch
                  :model-value="group.isActive"
                  :disabled="togglingGroupId === group.id"
                  @update:model-value="(val) => toggleGroupActive(group, val)"
                />
                <button
                  @click="deleteGroup(group)"
                  class="text-stone hover:text-[#d45656] transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <p v-if="group.description" class="text-sm text-steel mb-3">{{ group.description }}</p>
            
            <div class="flex items-center gap-4 text-sm">
              <div class="flex items-center gap-1 text-steel">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{{ group.usersCount }} users</span>
              </div>
              <div class="flex items-center gap-1 text-steel">
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
        <div class="relative bg-canvas rounded-2xl shadow-mm-2 w-full max-w-md">
          <div class="px-6 py-4 border-b border-hairline">
            <h3 class="text-lg font-semibold text-ink">Buat Group Baru</h3>
          </div>
          <form @submit.prevent="createGroup" class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-charcoal mb-2">Nama Group *</label>
              <input
                v-model="groupForm.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-hairline rounded-lg focus:ring-2 focus:ring-brand-blue-deep focus:border-ink"
                placeholder="Contoh: Personal, Finance, HR"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-charcoal mb-2">Deskripsi</label>
              <textarea
                v-model="groupForm.description"
                rows="3"
                class="w-full px-3 py-2 border border-hairline rounded-lg focus:ring-2 focus:ring-brand-blue-deep focus:border-ink"
                placeholder="Deskripsi singkat tentang group ini"
              ></textarea>
            </div>
            
            <!-- Bulk Add Users -->
            <div>
              <label class="block text-sm font-medium text-charcoal mb-2">
                Tambah Users (Opsional)
                <span class="text-xs text-steel font-normal ml-1">- {{ groupForm.selectedUsers.length }} dipilih</span>
              </label>
              <button
                type="button"
                @click="openBulkUserSelector"
                class="w-full px-4 py-3 border-2 border-dashed border-hairline rounded-lg active:border-ink hover:bg-surface transition-colors text-left"
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm text-steel">
                    {{ groupForm.selectedUsers.length > 0 ? `${groupForm.selectedUsers.length} user dipilih` : 'Klik untuk pilih users secara bulk' }}
                  </span>
                  <svg class="w-5 h-5 text-stone" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
            
            <!-- Bulk Add Clients -->
            <div>
              <label class="block text-sm font-medium text-charcoal mb-2">
                Tambah Aplikasi (Opsional)
                <span class="text-xs text-steel font-normal ml-1">- {{ groupForm.selectedClients.length }} dipilih</span>
              </label>
              <button
                type="button"
                @click="openBulkClientSelector"
                class="w-full px-4 py-3 border-2 border-dashed border-hairline rounded-lg active:border-ink hover:bg-surface transition-colors text-left"
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm text-steel">
                    {{ groupForm.selectedClients.length > 0 ? `${groupForm.selectedClients.length} aplikasi dipilih` : 'Klik untuk pilih aplikasi secara bulk' }}
                  </span>
                  <svg class="w-5 h-5 text-stone" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>

            <div class="flex gap-3 pt-4">
              <button
                type="button"
                @click="cancelCreateGroup"
                class="flex-1 px-4 py-2 border border-hairline text-charcoal rounded-lg hover:bg-surface transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="saving || !groupForm.name"
                class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-full active:bg-charcoal transition-colors disabled:opacity-50"
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
        <div class="relative bg-canvas rounded-2xl shadow-mm-2 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div class="px-6 py-4 border-b border-hairline sticky top-0 bg-canvas z-10">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-ink">{{ selectedGroup.name }}</h3>
              <button @click="showDetailsModal = false" class="text-stone hover:text-steel">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p v-if="selectedGroup.description" class="text-sm text-steel mt-1">{{ selectedGroup.description }}</p>
          </div>
          
          <div class="p-6 space-y-6">
            <!-- Users Section -->
            <div>
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-md font-semibold text-ink">Users ({{ groupDetails.users.length }})</h4>
                <button
                  @click="showAddUserModal = true"
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-full active:bg-charcoal transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah User
                </button>
              </div>
              
              <div v-if="groupDetails.users.length === 0" class="text-center py-8 bg-surface rounded-lg">
                <p class="text-steel">Belum ada user dalam group ini</p>
              </div>
              
              <div v-else class="max-h-96 overflow-y-auto space-y-2 pr-2">
                <div
                  v-for="user in groupDetails.users"
                  :key="user.id"
                  class="flex items-center justify-between p-3 border border-hairline rounded-lg hover:bg-surface"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-surface flex items-center justify-center">
                      <span class="text-ink text-sm font-medium">{{ (user.userName || '?')[0].toUpperCase() }}</span>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-ink">{{ user.userName || '-' }}</p>
                      <p class="text-xs text-steel">{{ user.userEmail || '-' }}</p>
                    </div>
                  </div>
                  <button
                    @click="confirmRemoveUser(user)"
                    class="text-[#d45656] hover:text-[#d45656] text-sm flex-shrink-0"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>

            <!-- Clients Section -->
            <div>
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-md font-semibold text-ink">Aplikasi ({{ groupDetails.clients.length }})</h4>
                <button
                  @click="showAddClientModal = true"
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-full active:bg-charcoal transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah Aplikasi
                </button>
              </div>
              
              <div v-if="groupDetails.clients.length === 0" class="text-center py-8 bg-surface rounded-lg">
                <p class="text-steel">Belum ada aplikasi dalam group ini</p>
              </div>
              
              <div v-else class="max-h-96 overflow-y-auto space-y-2 pr-2">
                <div
                  v-for="client in groupDetails.clients"
                  :key="client.id"
                  class="flex items-center justify-between p-3 border border-hairline rounded-lg hover:bg-surface"
                >
                  <div>
                    <p class="text-sm font-medium text-ink">{{ client.clientName || '-' }}</p>
                    <p v-if="client.clientDescription" class="text-xs text-steel">{{ client.clientDescription }}</p>
                  </div>
                  <button
                    @click="confirmRemoveClient(client)"
                    class="text-[#d45656] hover:text-[#d45656] text-sm flex-shrink-0"
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
        <div class="relative bg-canvas rounded-2xl shadow-mm-2 w-full max-w-md">
          <div class="px-6 py-4 border-b border-hairline">
            <h3 class="text-lg font-semibold text-ink">Tambah User ke Group</h3>
          </div>
          <form @submit.prevent="addUserToGroup" class="p-6 space-y-4">
            <div class="relative">
              <label class="block text-sm font-medium text-charcoal mb-2">User</label>
              <input
                v-if="!selectedUserToAdd"
                v-model="userSearchTerm"
                type="text"
                placeholder="Ketik nama, email, atau NIK..."
                autocomplete="off"
                class="w-full h-11 px-4 py-3 text-base border border-hairline rounded-md bg-canvas text-ink placeholder:text-steel focus-visible:border-brand-blue-deep focus-visible:border-2 focus-visible:outline-none"
                @focus="userDropdownOpen = true"
                @blur="hideUserDropdownSoon"
              />
              <div
                v-else
                class="flex items-center justify-between gap-2 px-4 py-3 border border-hairline rounded-md bg-surface"
              >
                <p class="text-sm font-medium text-ink truncate">{{ selectedUserLabel }}</p>
                <button type="button" @click="clearSelectedUserToAdd" class="text-steel hover:text-ink shrink-0">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div
                v-if="!selectedUserToAdd && userDropdownOpen && userSearchTerm.length >= 2"
                class="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-canvas border border-hairline rounded-md shadow-mm-2"
              >
                <div v-if="isSearching" class="p-3 text-sm text-steel">Mencari...</div>
                <template v-else>
                  <div
                    v-for="item in userItems"
                    :key="item.id"
                    @mousedown.prevent="selectUserToAdd(item)"
                    class="px-4 py-2.5 hover:bg-surface cursor-pointer"
                  >
                    <p class="text-sm text-ink">{{ item.label }}</p>
                    <p class="text-xs text-steel">{{ item.email }}{{ item.employeeId ? ` · ${item.employeeId}` : '' }}</p>
                  </div>
                  <div v-if="userItems.length === 0" class="p-3 text-sm text-steel">Tidak ada hasil</div>
                </template>
              </div>
            </div>
            <div class="flex gap-3 pt-4">
              <button
                type="button"
                @click="showAddUserModal = false; clearSelectedUserToAdd(); userSearchTerm = ''"
                class="flex-1 px-4 py-2 border border-hairline text-charcoal rounded-lg hover:bg-surface"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="saving || !selectedUserToAdd"
                class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-full active:bg-charcoal disabled:opacity-50"
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
        <div class="relative bg-canvas rounded-2xl shadow-mm-2 w-full max-w-md">
          <div class="px-6 py-4 border-b border-hairline">
            <h3 class="text-lg font-semibold text-ink">Tambah Aplikasi ke Group</h3>
          </div>
          <form @submit.prevent="addClientToGroup" class="p-6 space-y-4">
            <div class="relative">
              <label class="block text-sm font-medium text-charcoal mb-2">Aplikasi</label>
              <input
                v-if="!selectedClientToAdd"
                v-model="clientSearchTerm"
                type="text"
                placeholder="Cari aplikasi..."
                autocomplete="off"
                class="w-full h-11 px-4 py-3 text-base border border-hairline rounded-md bg-canvas text-ink placeholder:text-steel focus-visible:border-brand-blue-deep focus-visible:border-2 focus-visible:outline-none"
                @focus="clientDropdownOpen = true"
                @blur="clientDropdownOpen = false"
              />
              <div
                v-else
                class="flex items-center justify-between gap-2 px-4 py-3 border border-hairline rounded-md bg-surface"
              >
                <p class="text-sm font-medium text-ink truncate">{{ selectedClientLabel }}</p>
                <button type="button" @click="clearSelectedClientToAdd" class="text-steel hover:text-ink shrink-0">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div
                v-if="!selectedClientToAdd && clientDropdownOpen"
                class="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-canvas border border-hairline rounded-md shadow-mm-2"
              >
                <div
                  v-for="item in filteredClientItems"
                  :key="item.value"
                  @mousedown.prevent="selectClientToAdd(item)"
                  class="px-4 py-2.5 hover:bg-surface cursor-pointer text-sm text-ink"
                >
                  {{ item.label }}
                </div>
                <div v-if="filteredClientItems.length === 0" class="p-3 text-sm text-steel">Tidak ada hasil</div>
              </div>
            </div>
            <div class="flex gap-3 pt-4">
              <button
                type="button"
                @click="showAddClientModal = false; clearSelectedClientToAdd(); clientSearchTerm = ''"
                class="flex-1 px-4 py-2 border border-hairline text-charcoal rounded-lg hover:bg-surface"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="saving || !selectedClientToAdd"
                class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-full active:bg-charcoal disabled:opacity-50"
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
        <div class="relative bg-canvas rounded-2xl shadow-mm-2 w-full max-w-6xl max-h-[90vh] flex flex-col">
          <div class="px-6 py-4 border-b border-hairline">
            <h3 class="text-lg font-semibold text-ink">Pilih Users untuk Group</h3>
            <p class="text-sm text-steel mt-1">Pilih user dari kiri, lalu klik tombol untuk pindahkan ke kanan</p>
            <div class="flex gap-3 mt-3">
              <select
                v-model="bulkSiteFilter"
                class="h-9 px-3 text-sm border border-hairline rounded-md bg-canvas text-ink focus-visible:border-brand-blue-deep focus-visible:border-2 focus-visible:outline-none"
              >
                <option :value="null">Semua Site</option>
                <option v-for="site in bulkSites" :key="site.id" :value="site.id">{{ site.name }}</option>
              </select>
              <select
                v-model="bulkUnitFilter"
                class="h-9 px-3 text-sm border border-hairline rounded-md bg-canvas text-ink focus-visible:border-brand-blue-deep focus-visible:border-2 focus-visible:outline-none"
              >
                <option :value="null">Semua Unit</option>
                <option v-for="unit in bulkUnitFilterOptions" :key="unit.id" :value="unit.id">
                  {{ bulkSiteFilter ? unit.name : `${unit.siteName || '-'} - ${unit.name}` }}
                </option>
              </select>
            </div>
          </div>

          <div class="flex-1 overflow-hidden p-6 min-h-0">
            <div class="grid grid-cols-2 gap-6 h-full">
              <!-- Available Users (Left) -->
              <div class="flex flex-col border border-hairline rounded-lg h-full overflow-hidden">
                <div class="flex-1 overflow-y-auto">
                  <div class="sticky top-0 z-10 p-4 border-b border-hairline bg-surface">
                    <h4 class="font-medium text-ink mb-3">Tersedia ({{ filteredAvailableUsers.length }})</h4>
                    <input
                      v-model="availableUserSearch"
                      type="text"
                      placeholder="Cari user..."
                      class="w-full h-11 px-4 py-3 text-base border border-hairline rounded-md bg-canvas text-ink placeholder:text-steel focus-visible:border-brand-blue-deep focus-visible:border-2 focus-visible:outline-none"
                    />
                    <div class="mt-2 flex gap-2">
                      <button
                        type="button"
                        @click="selectAllAvailableUsers"
                        class="text-xs px-2 py-1 text-ink hover:bg-surface rounded"
                      >
                        Tambahkan Semua
                      </button>
                    </div>
                  </div>
                  <div class="p-2">
                    <div
                      v-for="user in filteredAvailableUsers"
                      :key="user.id"
                      @click="toggleAvailableUser(user.id)"
                      class="group flex items-center gap-3 p-3 hover:bg-surface rounded-lg cursor-pointer"
                      title="Klik untuk pindahkan ke Dipilih"
                    >
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-ink truncate">{{ user.name }}</p>
                        <p class="text-xs text-steel truncate">{{ user.email }}</p>
                      </div>
                      <svg class="w-4 h-4 text-steel shrink-0 opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <div v-if="filteredAvailableUsers.length === 0" class="text-center py-8 text-steel text-sm">
                      {{ availableUserSearch ? 'Tidak ada user yang cocok' : 'Semua user sudah dipilih' }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Selected Users (Right) -->
              <div class="flex flex-col border border-hairline rounded-lg h-full overflow-hidden">
                <div class="flex-1 overflow-y-auto">
                  <div class="sticky top-0 z-10 p-4 border-b border-hairline bg-surface">
                    <h4 class="font-medium text-ink mb-3">Dipilih ({{ filteredChosenUsers.length }})</h4>
                    <input
                      v-model="chosenUserSearch"
                      type="text"
                      placeholder="Cari user..."
                      class="w-full h-11 px-4 py-3 text-base border border-hairline rounded-md bg-canvas text-ink placeholder:text-steel focus-visible:border-brand-blue-deep focus-visible:border-2 focus-visible:outline-none"
                    />
                    <div class="mt-2 flex gap-2">
                      <button
                        type="button"
                        @click="deselectAllChosenUsers"
                        class="text-xs px-2 py-1 text-steel hover:bg-surface rounded"
                      >
                        Hapus Semua
                      </button>
                    </div>
                  </div>
                  <div class="p-2">
                    <div
                      v-for="user in filteredChosenUsers"
                      :key="user.id"
                      @click="toggleChosenUser(user.id)"
                      class="group flex items-center gap-3 p-3 hover:bg-surface rounded-lg cursor-pointer"
                      title="Klik untuk pindahkan ke Tersedia"
                    >
                      <svg class="w-4 h-4 text-steel shrink-0 opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                      </svg>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-ink truncate">{{ user.name }}</p>
                        <p class="text-xs text-steel truncate">{{ user.email }}</p>
                      </div>
                    </div>
                    <div v-if="filteredChosenUsers.length === 0" class="text-center py-8 text-steel text-sm">
                      {{ chosenUserSearch ? 'Tidak ada user yang cocok' : 'Belum ada user dipilih' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="px-6 py-4 border-t border-hairline flex gap-3">
            <button
              type="button"
              @click="closeBulkUserSelector"
              class="flex-1 px-4 py-2 border border-hairline text-charcoal rounded-lg hover:bg-surface"
            >
              Batal
            </button>
            <button
              type="button"
              @click="confirmBulkUserSelection"
              class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-full active:bg-charcoal"
            >
              Konfirmasi ({{ tempChosenUserIds.size }} user)
            </button>
          </div>
        </div>
      </div>

      <!-- Bulk Client Selector Modal -->
      <div v-if="showBulkClientSelector" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="closeBulkClientSelector"></div>
        <div class="relative bg-canvas rounded-2xl shadow-mm-2 w-full max-w-6xl max-h-[90vh] flex flex-col">
          <div class="px-6 py-4 border-b border-hairline">
            <h3 class="text-lg font-semibold text-ink">Pilih Aplikasi untuk Group</h3>
            <p class="text-sm text-steel mt-1">Pilih aplikasi dari kiri, lalu klik tombol untuk pindahkan ke kanan</p>
          </div>
          
          <div class="flex-1 overflow-hidden p-6 min-h-0">
            <div class="grid grid-cols-2 gap-6 h-full">
              <!-- Available Clients (Left) -->
              <div class="flex flex-col border border-hairline rounded-lg h-full overflow-hidden">
                <div class="flex-1 overflow-y-auto">
                  <div class="sticky top-0 z-10 p-4 border-b border-hairline bg-surface">
                    <h4 class="font-medium text-ink mb-3">Tersedia ({{ filteredAvailableClients.length }})</h4>
                    <input
                      v-model="availableClientSearch"
                      type="text"
                      placeholder="Cari aplikasi..."
                      class="w-full h-11 px-4 py-3 text-base border border-hairline rounded-md bg-canvas text-ink placeholder:text-steel focus-visible:border-brand-blue-deep focus-visible:border-2 focus-visible:outline-none"
                    />
                    <div class="mt-2 flex gap-2">
                      <button
                        type="button"
                        @click="selectAllAvailableClients"
                        class="text-xs px-2 py-1 text-ink hover:bg-surface rounded"
                      >
                        Tambahkan Semua
                      </button>
                    </div>
                  </div>
                  <div class="p-2">
                    <div
                      v-for="client in filteredAvailableClients"
                      :key="client.id"
                      @click="toggleAvailableClient(client.id)"
                      class="group flex items-center gap-3 p-3 hover:bg-surface rounded-lg cursor-pointer"
                      title="Klik untuk pindahkan ke Dipilih"
                    >
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-ink truncate">{{ client.clientName || client.name || client.clientId }}</p>
                        <p v-if="client.clientDescription" class="text-xs text-steel truncate">{{ client.clientDescription }}</p>
                      </div>
                      <svg class="w-4 h-4 text-steel shrink-0 opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <div v-if="filteredAvailableClients.length === 0" class="text-center py-8 text-steel text-sm">
                      {{ availableClientSearch ? 'Tidak ada aplikasi yang cocok' : 'Semua aplikasi sudah dipilih' }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Selected Clients (Right) -->
              <div class="flex flex-col border border-hairline rounded-lg h-full overflow-hidden">
                <div class="flex-1 overflow-y-auto">
                  <div class="sticky top-0 z-10 p-4 border-b border-hairline bg-surface">
                    <h4 class="font-medium text-ink mb-3">Dipilih ({{ filteredChosenClients.length }})</h4>
                    <input
                      v-model="chosenClientSearch"
                      type="text"
                      placeholder="Cari aplikasi..."
                      class="w-full h-11 px-4 py-3 text-base border border-hairline rounded-md bg-canvas text-ink placeholder:text-steel focus-visible:border-brand-blue-deep focus-visible:border-2 focus-visible:outline-none"
                    />
                    <div class="mt-2 flex gap-2">
                      <button
                        type="button"
                        @click="deselectAllChosenClients"
                        class="text-xs px-2 py-1 text-steel hover:bg-surface rounded"
                      >
                        Hapus Semua
                      </button>
                    </div>
                  </div>
                  <div class="p-2">
                    <div
                      v-for="client in filteredChosenClients"
                      :key="client.id"
                      @click="toggleChosenClient(client.id)"
                      class="group flex items-center gap-3 p-3 hover:bg-surface rounded-lg cursor-pointer"
                      title="Klik untuk pindahkan ke Tersedia"
                    >
                      <svg class="w-4 h-4 text-steel shrink-0 opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                      </svg>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-ink truncate">{{ client.clientName || client.name || client.clientId }}</p>
                        <p v-if="client.clientDescription" class="text-xs text-steel truncate">{{ client.clientDescription }}</p>
                      </div>
                    </div>
                    <div v-if="filteredChosenClients.length === 0" class="text-center py-8 text-steel text-sm">
                      {{ chosenClientSearch ? 'Tidak ada aplikasi yang cocok' : 'Belum ada aplikasi dipilih' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="px-6 py-4 border-t border-hairline flex gap-3">
            <button
              type="button"
              @click="closeBulkClientSelector"
              class="flex-1 px-4 py-2 border border-hairline text-charcoal rounded-lg hover:bg-surface"
            >
              Batal
            </button>
            <button
              type="button"
              @click="confirmBulkClientSelection"
              class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-full active:bg-charcoal"
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

<script setup>
import { refDebounced } from "@vueuse/core";
import { Switch } from "@/components/ui/switch";
definePageMeta({
  middleware: ["auth"]
});
const groups = ref([]);
const clients = ref([]);
const loading = ref(true);
const saving = ref(false);
const togglingGroupId = ref(null);
const showCreateGroupModal = ref(false);
const showDetailsModal = ref(false);
const showAddUserModal = ref(false);
const showAddClientModal = ref(false);
const showDeleteModal = ref(false);
const showDeleteUserModal = ref(false);
const showDeleteClientModal = ref(false);
const showErrorModal = ref(false);
const showBulkUserSelector = ref(false);
const showBulkClientSelector = ref(false);
const errorTitle = ref("Error");
const errorMessage = ref("");
const allUsers = ref([]);
const tempChosenUserIds = ref(/* @__PURE__ */ new Set());
const availableUserSearch = ref("");
const chosenUserSearch = ref("");
const bulkSites = ref([]);
const bulkUnits = ref([]);
const bulkSiteFilter = ref(null);
const bulkUnitFilter = ref(null);
const tempChosenClientIds = ref(/* @__PURE__ */ new Set());
const availableClientSearch = ref("");
const chosenClientSearch = ref("");
const selectedGroup = ref(null);
const groupToDelete = ref(null);
const userToDelete = ref(null);
const clientToDelete = ref(null);
const groupDetails = ref({
  users: [],
  clients: []
});
const groupForm = ref({
  name: "",
  description: "",
  selectedUsers: [],
  selectedClients: []
});
const bulkUserSearchTerm = ref("");
const bulkUserSearchTermDebounced = refDebounced(bulkUserSearchTerm, 300);
const bulkUserItems = ref([]);
const isBulkSearching = ref(false);
const userSearchTerm = ref("");
const userSearchTermDebounced = refDebounced(userSearchTerm, 300);
const userItems = ref([]);
const selectedUserToAdd = ref(null);
const selectedUserLabel = ref("");
const userDropdownOpen = ref(false);
const isSearching = ref(false);
const selectedClientToAdd = ref("");
const selectedClientLabel = ref("");
const clientSearchTerm = ref("");
const clientDropdownOpen = ref(false);
const clientItems = computed(() => {
  return clients.value.map((client) => ({
    label: client.clientName || client.name || client.clientId,
    value: client.id
  }));
});
const filteredClientItems = computed(() => {
  if (!clientSearchTerm.value) return clientItems.value;
  const search = clientSearchTerm.value.toLowerCase();
  return clientItems.value.filter((item) => item.label.toLowerCase().includes(search));
});
function selectUserToAdd(item) {
  selectedUserToAdd.value = item.id;
  selectedUserLabel.value = item.email ? `${item.label} · ${item.email}` : item.label;
  userSearchTerm.value = "";
  userItems.value = [];
  userDropdownOpen.value = false;
}
function clearSelectedUserToAdd() {
  selectedUserToAdd.value = null;
  selectedUserLabel.value = "";
}
function hideUserDropdownSoon() {
  userDropdownOpen.value = false;
}
function selectClientToAdd(item) {
  selectedClientToAdd.value = item.value;
  selectedClientLabel.value = item.label;
  clientSearchTerm.value = "";
  clientDropdownOpen.value = false;
}
function clearSelectedClientToAdd() {
  selectedClientToAdd.value = "";
  selectedClientLabel.value = "";
}
watch(bulkUserSearchTermDebounced, async (searchTerm) => {
  if (!searchTerm || searchTerm.length < 2) {
    bulkUserItems.value = [];
    isBulkSearching.value = false;
    return;
  }
  isBulkSearching.value = true;
  try {
    const res = await $fetch(`/api/admin/users?search=${encodeURIComponent(searchTerm)}&limit=20`);
    const users = res.data || [];
    bulkUserItems.value = users.map((user) => ({
      id: user.id,
      label: user.name,
      email: user.email,
      employeeId: user.employeeId,
      value: user.id
    }));
  } catch (error) {
    console.error("Bulk search error:", error);
    bulkUserItems.value = [];
  } finally {
    isBulkSearching.value = false;
  }
});
watch(userSearchTermDebounced, async (searchTerm) => {
  if (!searchTerm || searchTerm.length < 2) {
    userItems.value = [];
    isSearching.value = false;
    return;
  }
  isSearching.value = true;
  try {
    const res = await $fetch(`/api/admin/users?search=${encodeURIComponent(searchTerm)}&limit=10`);
    const users = res.data || [];
    userItems.value = users.map((user) => ({
      id: user.id,
      label: user.name,
      email: user.email,
      employeeId: user.employeeId
    }));
  } catch (error) {
    console.error("Search error:", error);
    userItems.value = [];
  } finally {
    isSearching.value = false;
  }
});
const bulkUnitFilterOptions = computed(() => {
  if (!bulkSiteFilter.value) return bulkUnits.value;
  return bulkUnits.value.filter((unit) => unit.siteId === bulkSiteFilter.value);
});
watch(bulkSiteFilter, () => {
  if (bulkUnitFilter.value && !bulkUnitFilterOptions.value.some((u) => u.id === bulkUnitFilter.value)) {
    bulkUnitFilter.value = null;
  }
});
function applyBulkSiteUnitFilter(list) {
  return list.filter((user) => {
    if (bulkSiteFilter.value && user.siteId !== bulkSiteFilter.value) return false;
    if (bulkUnitFilter.value && user.unitId !== bulkUnitFilter.value) return false;
    return true;
  });
}
const filteredAvailableUsers = computed(() => {
  let available = allUsers.value.filter((user) => !tempChosenUserIds.value.has(user.id));
  available = applyBulkSiteUnitFilter(available);
  if (!availableUserSearch.value) return available;
  const search = availableUserSearch.value.toLowerCase();
  return available.filter(
    (user) => user.name?.toLowerCase().includes(search) || user.email?.toLowerCase().includes(search) || user.employeeId?.toLowerCase().includes(search)
  );
});
const filteredChosenUsers = computed(() => {
  let chosen = allUsers.value.filter((user) => tempChosenUserIds.value.has(user.id));
  chosen = applyBulkSiteUnitFilter(chosen);
  if (!chosenUserSearch.value) return chosen;
  const search = chosenUserSearch.value.toLowerCase();
  return chosen.filter(
    (user) => user.name?.toLowerCase().includes(search) || user.email?.toLowerCase().includes(search) || user.employeeId?.toLowerCase().includes(search)
  );
});
const filteredAvailableClients = computed(() => {
  const available = clients.value.filter((client) => !tempChosenClientIds.value.has(client.id));
  if (!availableClientSearch.value) return available;
  const search = availableClientSearch.value.toLowerCase();
  return available.filter(
    (client) => (client.clientName || client.name || client.clientId || "").toLowerCase().includes(search) || (client.clientDescription || "").toLowerCase().includes(search)
  );
});
const filteredChosenClients = computed(() => {
  const chosen = clients.value.filter((client) => tempChosenClientIds.value.has(client.id));
  if (!chosenClientSearch.value) return chosen;
  const search = chosenClientSearch.value.toLowerCase();
  return chosen.filter(
    (client) => (client.clientName || client.name || client.clientId || "").toLowerCase().includes(search) || (client.clientDescription || "").toLowerCase().includes(search)
  );
});
async function loadGroups() {
  loading.value = true;
  try {
    const [groupsRes, clientsRes] = await Promise.all([
      $fetch("/api/admin/access-groups"),
      $fetch("/api/admin/clients")
    ]);
    groups.value = groupsRes.data || [];
    clients.value = clientsRes.data || clientsRes.clients || [];
  } catch (error) {
    console.error("Failed to load groups:", error);
  } finally {
    loading.value = false;
  }
}
async function createGroup() {
  saving.value = true;
  try {
    const response = await $fetch("/api/admin/access-groups", {
      method: "POST",
      body: {
        name: groupForm.value.name,
        description: groupForm.value.description
      }
    });
    const newGroup = response.data;
    if (groupForm.value.selectedUsers.length > 0) {
      await Promise.all(
        groupForm.value.selectedUsers.map(
          (userId) => $fetch(`/api/admin/access-groups/${newGroup.id}/users`, {
            method: "POST",
            body: { userId }
          }).catch((err) => console.error("Failed to add user:", userId, err))
        )
      );
    }
    if (groupForm.value.selectedClients.length > 0) {
      await Promise.all(
        groupForm.value.selectedClients.map(
          (clientId) => $fetch(`/api/admin/access-groups/${newGroup.id}/clients`, {
            method: "POST",
            body: { clientId }
          }).catch((err) => console.error("Failed to add client:", clientId, err))
        )
      );
    }
    showCreateGroupModal.value = false;
    groupForm.value = {
      name: "",
      description: "",
      selectedUsers: [],
      selectedClients: []
    };
    bulkUserSearchTerm.value = "";
    bulkUserItems.value = [];
    await loadGroups();
  } catch (error) {
    console.error("Failed to create group:", error);
    errorTitle.value = "Gagal Membuat Group";
    errorMessage.value = error.data?.message || error.message || "Terjadi kesalahan saat membuat group";
    showErrorModal.value = true;
  } finally {
    saving.value = false;
  }
}
function cancelCreateGroup() {
  showCreateGroupModal.value = false;
  groupForm.value = {
    name: "",
    description: "",
    selectedUsers: [],
    selectedClients: []
  };
  bulkUserSearchTerm.value = "";
  bulkUserItems.value = [];
}
async function openBulkUserSelector() {
  showBulkUserSelector.value = true;
  if (allUsers.value.length === 0) {
    try {
      const res = await $fetch("/api/admin/users?limit=5000");
      allUsers.value = res.data || [];
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  }
  if (bulkSites.value.length === 0 || bulkUnits.value.length === 0) {
    try {
      const [sitesRes, unitsRes] = await Promise.all([
        $fetch("/api/admin/sites"),
        $fetch("/api/admin/units")
      ]);
      bulkSites.value = sitesRes.sites || [];
      bulkUnits.value = unitsRes.units || [];
    } catch (error) {
      console.error("Failed to load sites/units:", error);
    }
  }
  tempChosenUserIds.value = new Set(groupForm.value.selectedUsers);
  availableUserSearch.value = "";
  chosenUserSearch.value = "";
  bulkSiteFilter.value = null;
  bulkUnitFilter.value = null;
}
function closeBulkUserSelector() {
  showBulkUserSelector.value = false;
  tempChosenUserIds.value = /* @__PURE__ */ new Set();
}
function toggleAvailableUser(userId) {
  tempChosenUserIds.value.add(userId);
}
function toggleChosenUser(userId) {
  tempChosenUserIds.value.delete(userId);
}
function selectAllAvailableUsers() {
  filteredAvailableUsers.value.forEach((user) => {
    tempChosenUserIds.value.add(user.id);
  });
}
function deselectAllChosenUsers() {
  filteredChosenUsers.value.forEach((user) => {
    tempChosenUserIds.value.delete(user.id);
  });
}
function confirmBulkUserSelection() {
  groupForm.value.selectedUsers = Array.from(tempChosenUserIds.value);
  closeBulkUserSelector();
}
async function openBulkClientSelector() {
  showBulkClientSelector.value = true;
  tempChosenClientIds.value = new Set(groupForm.value.selectedClients);
  availableClientSearch.value = "";
  chosenClientSearch.value = "";
}
function closeBulkClientSelector() {
  showBulkClientSelector.value = false;
  tempChosenClientIds.value = /* @__PURE__ */ new Set();
}
function toggleAvailableClient(clientId) {
  tempChosenClientIds.value.add(clientId);
}
function toggleChosenClient(clientId) {
  tempChosenClientIds.value.delete(clientId);
}
function selectAllAvailableClients() {
  filteredAvailableClients.value.forEach((client) => {
    tempChosenClientIds.value.add(client.id);
  });
}
function deselectAllChosenClients() {
  filteredChosenClients.value.forEach((client) => {
    tempChosenClientIds.value.delete(client.id);
  });
}
function confirmBulkClientSelection() {
  groupForm.value.selectedClients = Array.from(tempChosenClientIds.value);
  closeBulkClientSelector();
}
async function viewGroupDetails(group) {
  selectedGroup.value = group;
  showDetailsModal.value = true;
  try {
    const res = await $fetch(`/api/admin/access-groups/${group.id}/details`);
    groupDetails.value = res.data || { users: [], clients: [] };
  } catch (error) {
    console.error("Failed to load group details:", error);
  }
}
async function addUserToGroup() {
  if (!selectedUserToAdd.value || !selectedGroup.value) return;
  saving.value = true;
  try {
    const userId = typeof selectedUserToAdd.value === "string" ? selectedUserToAdd.value : selectedUserToAdd.value.id;
    await $fetch(`/api/admin/access-groups/${selectedGroup.value.id}/users`, {
      method: "POST",
      body: {
        userId
      }
    });
    showAddUserModal.value = false;
    clearSelectedUserToAdd();
    userSearchTerm.value = "";
    userItems.value = [];
    await viewGroupDetails(selectedGroup.value);
  } catch (error) {
    console.error("Failed to add user to group:", error);
    errorTitle.value = "Gagal Menambah User";
    errorMessage.value = error.data?.message || error.message || "Terjadi kesalahan saat menambahkan user ke group";
    showErrorModal.value = true;
  } finally {
    saving.value = false;
  }
}
function confirmRemoveUser(user) {
  userToDelete.value = user;
  showDeleteUserModal.value = true;
}
function cancelRemoveUser() {
  userToDelete.value = null;
  showDeleteUserModal.value = false;
}
async function doRemoveUserFromGroup() {
  if (!selectedGroup.value || !userToDelete.value) return;
  saving.value = true;
  try {
    await $fetch(`/api/admin/access-groups/${selectedGroup.value.id}/users/${userToDelete.value.id}`, {
      method: "DELETE"
    });
    showDeleteUserModal.value = false;
    userToDelete.value = null;
    await viewGroupDetails(selectedGroup.value);
  } catch (error) {
    console.error("Failed to remove user from group:", error);
    errorTitle.value = "Gagal Menghapus User";
    errorMessage.value = error.data?.message || error.message || "Terjadi kesalahan saat menghapus user dari group";
    showErrorModal.value = true;
  } finally {
    saving.value = false;
  }
}
async function addClientToGroup() {
  if (!selectedClientToAdd.value || !selectedGroup.value) return;
  saving.value = true;
  try {
    await $fetch(`/api/admin/access-groups/${selectedGroup.value.id}/clients`, {
      method: "POST",
      body: {
        clientId: selectedClientToAdd.value
      }
    });
    showAddClientModal.value = false;
    clearSelectedClientToAdd();
    clientSearchTerm.value = "";
    await viewGroupDetails(selectedGroup.value);
  } catch (error) {
    console.error("Failed to add client to group:", error);
    errorTitle.value = "Gagal Menambah Aplikasi";
    errorMessage.value = error.data?.message || error.message || "Terjadi kesalahan saat menambahkan aplikasi ke group";
    showErrorModal.value = true;
  } finally {
    saving.value = false;
  }
}
function confirmRemoveClient(client) {
  clientToDelete.value = client;
  showDeleteClientModal.value = true;
}
function cancelRemoveClient() {
  clientToDelete.value = null;
  showDeleteClientModal.value = false;
}
async function doRemoveClientFromGroup() {
  if (!selectedGroup.value || !clientToDelete.value) return;
  saving.value = true;
  try {
    await $fetch(`/api/admin/access-groups/${selectedGroup.value.id}/clients/${clientToDelete.value.id}`, {
      method: "DELETE"
    });
    showDeleteClientModal.value = false;
    clientToDelete.value = null;
    await viewGroupDetails(selectedGroup.value);
  } catch (error) {
    console.error("Failed to remove client from group:", error);
    errorTitle.value = "Gagal Menghapus Aplikasi";
    errorMessage.value = error.data?.message || error.message || "Terjadi kesalahan saat menghapus aplikasi dari group";
    showErrorModal.value = true;
  } finally {
    saving.value = false;
  }
}
function deleteGroup(group) {
  groupToDelete.value = group;
  showDeleteModal.value = true;
}
async function toggleGroupActive(group, nextValue) {
  togglingGroupId.value = group.id;
  const previous = group.isActive;
  group.isActive = nextValue;
  try {
    await $fetch(`/api/admin/access-groups/${group.id}`, {
      method: "PUT",
      body: { isActive: nextValue }
    });
  } catch (error) {
    console.error("Failed to toggle group active state:", error);
    group.isActive = previous;
    errorTitle.value = "Gagal Mengubah Status Group";
    errorMessage.value = error.data?.message || error.message || "Terjadi kesalahan saat mengubah status group";
    showErrorModal.value = true;
  } finally {
    togglingGroupId.value = null;
  }
}
async function doDeleteGroup() {
  if (!groupToDelete.value) return;
  try {
    await $fetch(`/api/admin/access-groups/${groupToDelete.value.id}`, {
      method: "DELETE"
    });
    showDeleteModal.value = false;
    groupToDelete.value = null;
    await loadGroups();
  } catch (error) {
    console.error("Failed to delete group:", error);
  }
}
onMounted(() => {
  loadGroups();
});
</script>
