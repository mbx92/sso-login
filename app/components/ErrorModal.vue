<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="isOpen" class="fixed inset-0 z-[100] overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <!-- Backdrop -->
          <div class="fixed inset-0 bg-black/50" @click="close"></div>
          
          <!-- Modal -->
          <Transition
            enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div v-if="isOpen" class="relative bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
              <!-- Header -->
              <div :class="[
                'px-6 py-4 flex items-center gap-3',
                type === 'error' ? 'bg-red-50' : 
                type === 'warning' ? 'bg-amber-50' : 
                type === 'success' ? 'bg-emerald-50' : 'bg-blue-50'
              ]">
                <!-- Icon -->
                <div :class="[
                  'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                  type === 'error' ? 'bg-red-100' : 
                  type === 'warning' ? 'bg-amber-100' : 
                  type === 'success' ? 'bg-emerald-100' : 'bg-blue-100'
                ]">
                  <!-- Error Icon -->
                  <svg v-if="type === 'error'" :class="['w-5 h-5', 'text-red-600']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <!-- Warning Icon -->
                  <svg v-else-if="type === 'warning'" :class="['w-5 h-5', 'text-amber-600']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <!-- Success Icon -->
                  <svg v-else-if="type === 'success'" :class="['w-5 h-5', 'text-emerald-600']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <!-- Info Icon -->
                  <svg v-else :class="['w-5 h-5', 'text-blue-600']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                
                <h3 :class="[
                  'text-lg font-semibold',
                  type === 'error' ? 'text-red-900' : 
                  type === 'warning' ? 'text-amber-900' : 
                  type === 'success' ? 'text-emerald-900' : 'text-blue-900'
                ]">
                  {{ title }}
                </h3>
              </div>
              
              <!-- Body -->
              <div class="px-6 py-4">
                <p class="text-gray-600">{{ message }}</p>
              </div>
              
              <!-- Footer -->
              <div class="px-6 py-4 bg-gray-50 flex justify-end">
                <button
                  @click="close"
                  :class="[
                    'px-4 py-2 rounded-lg font-medium transition-colors',
                    type === 'error' ? 'bg-red-600 hover:bg-red-700 text-white' : 
                    type === 'warning' ? 'bg-amber-600 hover:bg-amber-700 text-white' : 
                    type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 
                    'bg-blue-600 hover:bg-blue-700 text-white'
                  ]"
                >
                  {{ buttonText }}
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean
  type?: 'error' | 'warning' | 'success' | 'info'
  title?: string
  message: string
  buttonText?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'error',
  title: 'Error',
  buttonText: 'OK'
})

const emit = defineEmits<{
  close: []
}>()

function close() {
  emit('close')
}

// Close on Escape key
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.isOpen) {
      close()
    }
  }
  window.addEventListener('keydown', handleEscape)
  onUnmounted(() => {
    window.removeEventListener('keydown', handleEscape)
  })
})
</script>
