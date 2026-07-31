import { provideSSRWidth } from '@vueuse/core'

export default defineNuxtPlugin((nuxtApp) => {
  // VueUse signature: provideSSRWidth(width, app?)
  provideSSRWidth(1024, nuxtApp.vueApp)
})
