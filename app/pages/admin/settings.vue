<template>
  <NuxtLayout name="admin">
    <div class="space-y-6">
      <!-- Page Header -->
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Settings</h1>
        <p class="text-sm text-gray-500 mt-1">Configure system settings</p>
      </div>

      <!-- Settings Sections -->
      <div class="space-y-6">
        <!-- General Settings -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">General</h3>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Application Name</label>
              <input
                v-model="settings.appName"
                type="text"
                class="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">SSO Issuer URL</label>
              <input
                v-model="settings.issuerUrl"
                type="url"
                class="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <!-- Session Settings -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Session</h3>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
              <input
                v-model.number="settings.sessionTimeout"
                type="number"
                min="5"
                max="1440"
                class="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Token Expiry (hours)</label>
              <input
                v-model.number="settings.tokenExpiry"
                type="number"
                min="1"
                max="168"
                class="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <!-- Security Settings -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Security</h3>
          </div>
          <div class="p-6 space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">Enforce MFA</p>
                <p class="text-sm text-gray-500">Require multi-factor authentication for all users</p>
              </div>
              <button
                @click="settings.enforceMfa = !settings.enforceMfa"
                :class="[
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                  settings.enforceMfa ? 'bg-emerald-600' : 'bg-gray-200'
                ]"
              >
                <span
                  :class="[
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                    settings.enforceMfa ? 'translate-x-5' : 'translate-x-0'
                  ]"
                />
              </button>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">Allow Password Reset</p>
                <p class="text-sm text-gray-500">Enable self-service password reset</p>
              </div>
              <button
                @click="settings.allowPasswordReset = !settings.allowPasswordReset"
                :class="[
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                  settings.allowPasswordReset ? 'bg-emerald-600' : 'bg-gray-200'
                ]"
              >
                <span
                  :class="[
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                    settings.allowPasswordReset ? 'translate-x-5' : 'translate-x-0'
                  ]"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- HRIS Integration -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">HRIS Integration</h3>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">HRIS API URL</label>
              <input
                v-model="settings.hrisApiUrl"
                type="url"
                class="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="https://hris.company.com/api"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Sync Interval (minutes)</label>
              <input
                v-model.number="settings.syncInterval"
                type="number"
                min="5"
                max="1440"
                class="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end">
        <button
          @click="saveSettings"
          :disabled="saving"
          class="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <svg v-if="saving" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth']
})

const saving = ref(false)

const settings = ref({
  appName: 'SSO Identity Provider',
  issuerUrl: 'https://sso.company.com',
  sessionTimeout: 60,
  tokenExpiry: 24,
  enforceMfa: false,
  allowPasswordReset: true,
  hrisApiUrl: '',
  syncInterval: 60
})

async function saveSettings() {
  saving.value = true
  try {
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('Settings saved:', settings.value)
  } catch (error) {
    console.error('Failed to save settings:', error)
  } finally {
    saving.value = false
  }
}
</script>
