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
              <UInput
                v-model="settings.appName"
                placeholder="Application name"
                class="max-w-md"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">SSO Issuer URL</label>
              <UInput
                v-model="settings.issuerUrl"
                type="url"
                placeholder="https://sso.company.com"
                class="max-w-md"
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
              <UInput
                v-model.number="settings.sessionTimeout"
                type="number"
                :min="5"
                :max="1440"
                class="w-32"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Token Expiry (hours)</label>
              <UInput
                v-model.number="settings.tokenExpiry"
                type="number"
                :min="1"
                :max="168"
                class="w-32"
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
              <USwitch v-model="settings.enforceMfa" />
            </div>
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">Allow Password Reset</p>
                <p class="text-sm text-gray-500">Enable self-service password reset</p>
              </div>
              <USwitch v-model="settings.allowPasswordReset" />
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
              <UInput
                v-model="settings.hrisApiUrl"
                type="url"
                placeholder="https://hris.company.com/api"
                class="max-w-md"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Sync Interval (minutes)</label>
              <UInput
                v-model.number="settings.syncInterval"
                type="number"
                :min="5"
                :max="1440"
                class="w-32"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end">
        <UButton
          @click="saveSettings"
          :loading="saving"
          :disabled="saving"
          color="primary"
        >
          Save Changes
        </UButton>
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
