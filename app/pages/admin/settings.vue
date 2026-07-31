<template>
  <NuxtLayout name="admin">
    <div class="space-y-6">
      <!-- Page Header -->
      <div>
        <h1 class="text-2xl font-semibold text-ink">Settings</h1>
        <p class="text-sm text-steel mt-1">Configure system settings</p>
      </div>

      <!-- Settings Sections -->
      <div class="space-y-6">
        <!-- General Settings -->
        <div class="bg-canvas rounded-xl border border-hairline shadow-none overflow-hidden">
          <div class="px-6 py-4 border-b border-hairline">
            <h3 class="text-lg font-semibold text-ink">General</h3>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-charcoal mb-2">Application Name</label>
              <UInput
                v-model="settings.appName"
                placeholder="Application name"
                class="max-w-md"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-charcoal mb-2">SSO Issuer URL</label>
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
        <div class="bg-canvas rounded-xl border border-hairline shadow-none overflow-hidden">
          <div class="px-6 py-4 border-b border-hairline">
            <h3 class="text-lg font-semibold text-ink">Session</h3>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-charcoal mb-2">Session Timeout (minutes)</label>
              <UInput
                v-model.number="settings.sessionTimeout"
                type="number"
                :min="5"
                :max="1440"
                class="w-32"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-charcoal mb-2">Token Expiry (hours)</label>
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
        <div class="bg-canvas rounded-xl border border-hairline shadow-none overflow-hidden">
          <div class="px-6 py-4 border-b border-hairline">
            <h3 class="text-lg font-semibold text-ink">Security</h3>
          </div>
          <div class="p-6 space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-ink">Enforce MFA</p>
                <p class="text-sm text-steel">Require multi-factor authentication for all users</p>
              </div>
              <USwitch v-model="settings.enforceMfa" />
            </div>
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-ink">Allow Password Reset</p>
                <p class="text-sm text-steel">Enable self-service password reset</p>
              </div>
              <USwitch v-model="settings.allowPasswordReset" />
            </div>
          </div>
        </div>

        <!-- HRIS Integration -->
        <div class="bg-canvas rounded-xl border border-hairline shadow-none overflow-hidden">
          <div class="px-6 py-4 border-b border-hairline">
            <h3 class="text-lg font-semibold text-ink">HRIS Integration</h3>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-charcoal mb-2">HRIS API URL</label>
              <UInput
                v-model="settings.hrisApiUrl"
                type="url"
                placeholder="https://hris.company.com/api"
                class="max-w-md"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-charcoal mb-2">Sync Interval (minutes)</label>
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

<script setup>
definePageMeta({
  middleware: ["auth"]
});
const saving = ref(false);
const settings = ref({
  appName: "SSO Identity Provider",
  issuerUrl: "https://sso.company.com",
  sessionTimeout: 60,
  tokenExpiry: 24,
  enforceMfa: false,
  allowPasswordReset: true,
  hrisApiUrl: "",
  syncInterval: 60
});
async function saveSettings() {
  saving.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 1e3));
    console.log("Settings saved:", settings.value);
  } catch (error) {
    console.error("Failed to save settings:", error);
  } finally {
    saving.value = false;
  }
}
</script>
