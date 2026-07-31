<script setup>
import { computed } from 'vue'
import * as LucideIcons from '@lucide/vue'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  icon: { type: String, default: null },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  class: { type: [String, Object, Array], default: '' },
})

const emit = defineEmits(['update:modelValue'])

function toPascal(name) {
  return name
    .replace(/^i-lucide-/, '')
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

const Icon = computed(() => {
  if (!props.icon) return null
  return LucideIcons[toPascal(props.icon)] || null
})
</script>

<template>
  <div :class="cn('relative w-full', props.class)">
    <component
      :is="Icon"
      v-if="Icon"
      class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
    />
    <Input
      :model-value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="cn(Icon ? 'pl-9' : '', 'w-full')"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </div>
</template>
