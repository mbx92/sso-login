<template>
  <div class="flex min-h-screen bg-canvas">
    <aside class="fixed inset-y-0 left-0 z-30 flex w-[220px] flex-col border-r border-hairline-soft bg-canvas">
      <div class="flex h-14 items-center gap-2.5 border-b border-hairline-soft px-4">
        <div class="flex size-7 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground tracking-tight">
          SSO
        </div>
        <div class="min-w-0">
          <p class="truncate text-[14px] font-semibold text-ink">SSO Admin</p>
          <p class="truncate text-[12px] text-steel">Platform</p>
        </div>
      </div>

      <ScrollArea class="flex-1 px-2 py-3">
        <nav class="space-y-0.5">
          <NuxtLink
            v-for="item in filteredMenuItems"
            :key="item.to"
            :to="item.to"
            :class="cn(
              'flex items-center gap-2.5 rounded-sm px-4 py-2 text-[14px] transition-colors duration-150',
              isActive(item.to)
                ? 'bg-surface font-medium text-ink'
                : 'font-normal text-charcoal',
            )"
          >
            <component :is="item.icon" class="size-4 shrink-0" />
            {{ item.label }}
          </NuxtLink>

          <div class="my-3 border-t border-hairline-soft" />

          <NuxtLink
            v-for="item in secondaryItems"
            :key="item.to"
            :to="item.to"
            :class="cn(
              'flex items-center gap-2.5 rounded-sm px-4 py-2 text-[14px] transition-colors duration-150',
              isActive(item.to)
                ? 'bg-surface font-medium text-ink'
                : 'font-normal text-charcoal',
            )"
          >
            <component :is="item.icon" class="size-4 shrink-0" />
            {{ item.label }}
          </NuxtLink>
        </nav>
      </ScrollArea>

      <div class="border-t border-hairline-soft p-3">
        <div class="flex items-center gap-2.5 rounded-lg bg-surface px-3 py-2.5">
          <div class="flex size-8 items-center justify-center rounded-full bg-primary text-[12px] font-semibold text-primary-foreground">
            {{ userInitial }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-[13px] font-semibold text-ink">{{ userName }}</p>
            <p class="truncate text-[12px] text-steel">{{ userRole }}</p>
          </div>
          <Button as-child variant="secondary" size="icon-sm" class="size-9 shrink-0">
            <NuxtLink to="/logout" title="Logout">
              <LogOut class="size-4" />
            </NuxtLink>
          </Button>
        </div>
      </div>
    </aside>

    <div class="ml-[220px] flex min-w-0 flex-1 flex-col">
      <header class="flex h-14 shrink-0 items-center justify-between border-b border-hairline-soft bg-canvas px-6">
        <h1 class="text-[20px] font-semibold tracking-tight text-ink">{{ pageTitle }}</h1>
        <Button as-child variant="secondary" size="icon-sm">
          <NuxtLink to="/admin/settings">
            <Settings class="size-4" />
          </NuxtLink>
        </Button>
      </header>

      <main class="flex-1 overflow-auto bg-surface p-6 md:p-8">
        <div class="mx-auto max-w-[1280px]">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import {
  Building2,
  Box,
  FileText,
  Globe2,
  Home,
  KeyRound,
  Lock,
  LogOut,
  Settings,
  Shield,
  Activity,
  Users,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

const route = useRoute()
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
  const roleName = currentUser.value?.roleName?.toLowerCase?.()
  const roleId = currentUser.value?.roleId
  return roleName === 'superadmin' || roleId === 'superadmin'
})
const userName = computed(() => currentUser.value?.name || 'User')
const userRole = computed(() => currentUser.value?.roleName || 'User')
const userInitial = computed(() => userName.value.charAt(0).toUpperCase())
const siteSettings = ref(null)

onMounted(async () => {
  try {
    const response = await $fetch('/api/admin/sites/current')
    siteSettings.value = response
  } catch (error) {
    console.error('Failed to fetch site settings:', error)
    siteSettings.value = { useDivisions: true, useUnits: true }
  }
})

const menuItems = [
  { label: 'Dashboard', to: '/admin', icon: Home, superadminOnly: false, requiresDivisions: false, requiresUnits: false },
  { label: 'Sites', to: '/admin/sites', icon: Globe2, superadminOnly: true, requiresDivisions: false, requiresUnits: false },
  { label: 'Divisi', to: '/admin/divisions', icon: Building2, superadminOnly: false, requiresDivisions: true, requiresUnits: false },
  { label: 'Unit', to: '/admin/units', icon: Box, superadminOnly: false, requiresDivisions: false, requiresUnits: true },
  { label: 'Users', to: '/admin/users', icon: Users, superadminOnly: false, requiresDivisions: false, requiresUnits: false },
  { label: 'Roles', to: '/admin/roles', icon: Lock, superadminOnly: false, requiresDivisions: false, requiresUnits: false },
  { label: 'OIDC Clients', to: '/admin/clients', icon: KeyRound, superadminOnly: false, requiresDivisions: false, requiresUnits: false },
  { label: 'User Access', to: '/admin/user-access', icon: Shield, superadminOnly: false, requiresDivisions: false, requiresUnits: false },
  { label: 'Active Sessions', to: '/admin/sessions', icon: Activity, superadminOnly: false, requiresDivisions: false, requiresUnits: false },
]

const filteredMenuItems = computed(() =>
  menuItems.filter((item) => {
    if (item.superadminOnly && !isSuperAdmin.value) return false
    if (item.requiresDivisions && siteSettings.value && !siteSettings.value.useDivisions) return false
    if (item.requiresUnits && siteSettings.value && !siteSettings.value.useUnits) return false
    return true
  }),
)

const secondaryItems = [
  { label: 'Settings', to: '/admin/settings', icon: Settings },
  { label: 'Audit Logs', to: '/admin/audit-logs', icon: FileText },
]

const isActive = (path) => {
  if (path === '/admin') return route.path === '/admin'
  return route.path.startsWith(path)
}

const pageTitle = computed(() => {
  const titles = {
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
