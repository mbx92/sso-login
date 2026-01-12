<template>
  <div class="min-h-screen flex bg-gray-100">
    <!-- Sidebar - Fixed -->
    <aside class="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 fixed inset-y-0 left-0 z-30">
      <!-- Logo -->
      <div class="h-16 flex items-center gap-3 px-4 border-b border-gray-200">
        <div class="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
          <span class="text-white font-bold text-sm">SSO</span>
        </div>
        <span class="font-semibold text-gray-900">SSO Admin</span>
      </div>

      <!-- Navigation - Scrollable -->
      <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
        <NuxtLink
          v-for="item in filteredMenuItems"
          :key="item.to"
          :to="item.to"
          :class="[
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            isActive(item.to)
              ? 'bg-emerald-50 text-emerald-700'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          ]"
        >
          <component :is="item.icon" class="w-5 h-5" />
          {{ item.label }}
        </NuxtLink>

        <div class="pt-4 mt-4 border-t border-gray-200 space-y-1">
          <NuxtLink
            v-for="item in secondaryItems"
            :key="item.to"
            :to="item.to"
            :class="[
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive(item.to)
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            ]"
          >
            <component :is="item.icon" class="w-5 h-5" />
            {{ item.label }}
          </NuxtLink>
        </div>
      </nav>

      <!-- User Menu - Always at bottom -->
      <div class="p-4 border-t border-gray-200 bg-white">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <span class="text-emerald-700 font-semibold">{{ userInitial }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ userName }}</p>
            <p class="text-xs text-gray-500 truncate">{{ userRole }}</p>
          </div>
          <NuxtLink
            to="/logout"
            class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            title="Logout"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </aside>

    <!-- Main Content - With left margin to account for fixed sidebar -->
    <div class="flex-1 flex flex-col min-w-0 ml-64">
      <!-- Header -->
      <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
        <div>
          <h1 class="text-lg font-semibold text-gray-900">{{ pageTitle }}</h1>
        </div>
        <div class="flex items-center gap-2">
          <NuxtLink
            to="/admin/settings"
            class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </NuxtLink>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'

const route = useRoute()

// Get user from cookie
const userCookie = useCookie('sso_user')
const currentUser = computed(() => {
  if (!userCookie.value) return null
  try {
    if (typeof userCookie.value === 'string') {
      return JSON.parse(userCookie.value)
    }
    return userCookie.value
  } catch {
    return null
  }
})

const isSuperAdmin = computed(() => {
  const user = currentUser.value
  if (!user) return false
  
  // Check new roles array
  if (Array.isArray(user.roles) && user.roles.includes('superadmin')) {
    return true
  }
  
  // Legacy check for backward compatibility
  return user.roleName?.toLowerCase() === 'superadmin'
})
const userName = computed(() => currentUser.value?.name || 'User')
const userRole = computed(() => {
  const user = currentUser.value
  if (!user) return 'User'
  
  // Show first role from roles array
  if (Array.isArray(user.roles) && user.roles.length > 0) {
    return user.roles[0]
  }
  
  // Legacy fallback
  return user.roleName || 'User'
})
const userInitial = computed(() => userName.value.charAt(0).toUpperCase())

// Site settings for conditional menu items
const siteSettings = ref<{ useDivisions: boolean; useUnits: boolean } | null>(null)

// Fetch site settings on mount
onMounted(async () => {
  try {
    const response = await $fetch<{ useDivisions: boolean; useUnits: boolean }>('/api/admin/sites/current')
    siteSettings.value = response
  } catch (error) {
    console.error('Failed to fetch site settings:', error)
    // Default to showing menus if fetch fails
    siteSettings.value = { useDivisions: true, useUnits: true }
  }
})

// SVG icon components
const HomeIcon = () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' })
])

const UsersIcon = () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' })
])

const KeyIcon = () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' })
])

const ShieldIcon = () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' })
])

const SettingsIcon = () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }),
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' })
])

const LogsIcon = () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' })
])

const BuildingIcon = () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' })
])

const CubeIcon = () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' })
])

const GlobeIcon = () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' })
])

const LockIcon = () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' })
])

const SessionsIcon = () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' })
])

const menuItems = [
  { label: 'Dashboard', to: '/admin', icon: HomeIcon, superadminOnly: false, requiresDivisions: false, requiresUnits: false },
  { label: 'Sites', to: '/admin/sites', icon: GlobeIcon, superadminOnly: true, requiresDivisions: false, requiresUnits: false },
  { label: 'Divisi', to: '/admin/divisions', icon: BuildingIcon, superadminOnly: false, requiresDivisions: true, requiresUnits: false },
  { label: 'Unit', to: '/admin/units', icon: CubeIcon, superadminOnly: false, requiresDivisions: false, requiresUnits: true },
  { label: 'Users', to: '/admin/users', icon: UsersIcon, superadminOnly: false, requiresDivisions: false, requiresUnits: false },
  { label: 'Roles', to: '/admin/roles', icon: LockIcon, superadminOnly: false, requiresDivisions: false, requiresUnits: false },
  { label: 'OIDC Clients', to: '/admin/clients', icon: KeyIcon, superadminOnly: false, requiresDivisions: false, requiresUnits: false },
  { label: 'User Access', to: '/admin/user-access', icon: ShieldIcon, superadminOnly: false, requiresDivisions: false, requiresUnits: false },
  { label: 'Active Sessions', to: '/admin/sessions', icon: SessionsIcon, superadminOnly: false, requiresDivisions: false, requiresUnits: false },
]

// Filter menu based on user role and site settings
const filteredMenuItems = computed(() => {
  return menuItems.filter(item => {
    // Check superadmin restriction
    if (item.superadminOnly && !isSuperAdmin.value) {
      return false
    }
    // Check divisions requirement
    if (item.requiresDivisions && siteSettings.value && !siteSettings.value.useDivisions) {
      return false
    }
    // Check units requirement
    if (item.requiresUnits && siteSettings.value && !siteSettings.value.useUnits) {
      return false
    }
    return true
  })
})

const secondaryItems = [
  { label: 'Settings', to: '/admin/settings', icon: SettingsIcon },
  { label: 'Audit Logs', to: '/admin/audit-logs', icon: LogsIcon },
]

const isActive = (path: string) => {
  if (path === '/admin') {
    return route.path === '/admin'
  }
  return route.path.startsWith(path)
}

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/admin': 'Dashboard',
    '/admin/sites': 'Master Site',
    '/admin/divisions': 'Master Divisi',
    '/admin/units': 'Master Unit',
    '/admin/users': 'Manajemen User',
    '/admin/roles': 'Roles & Permissions',
    '/admin/clients': 'OIDC Clients',
    '/admin/user-access': 'User Access',
    '/admin/sessions': 'Active Sessions',
    '/admin/settings': 'Settings',
    '/admin/audit-logs': 'Audit Logs',
  }
  return titles[route.path] || 'Admin'
})
</script>
