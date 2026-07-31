<script setup>
import { computed } from 'vue'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  class: { type: [String, Object, Array], default: '' },
})

const emit = defineEmits(['update:modelValue'])

const id = `sw-${Math.random().toString(36).slice(2, 9)}`

const model = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
</script>

<template>
  <div :class="cn('flex items-center gap-2', props.class)">
    <Switch :id="id" v-model="model" :disabled="disabled" />
    <Label v-if="label || $slots.default" :for="id" class="font-normal cursor-pointer">
      <slot>{{ label }}</slot>
    </Label>
  </div>
</template>
