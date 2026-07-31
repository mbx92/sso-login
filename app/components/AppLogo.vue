<script setup>
import { Lock } from '@lucide/vue'
import { computed } from 'vue'

const props = defineProps({
  size: { type: [Number, String], default: 32 },
  showLabel: { type: Boolean, default: false },
  label: { type: String, default: 'SSO Login' },
})

const box = computed(() => Number(props.size) || 32)
const iconPx = computed(() => Math.round(box.value * 0.55))
</script>

<template>
  <div class="inline-flex min-w-0 items-center gap-2.5">
    <div
      class="flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
      :style="{ width: `${box}px`, height: `${box}px` }"
    >
      <Lock :size="iconPx" :stroke-width="2.25" aria-hidden="true" />
    </div>
    <span
      v-if="showLabel"
      class="truncate text-[14px] font-semibold tracking-tight text-ink"
    >
      {{ label }}
    </span>
  </div>
</template>
