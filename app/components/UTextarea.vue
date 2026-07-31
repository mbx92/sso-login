<script setup>
import { computed } from 'vue'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  rows: { type: [String, Number], default: 3 },
  class: { type: [String, Object, Array], default: '' },
})

const emit = defineEmits(['update:modelValue'])

const model = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
</script>

<template>
  <Textarea
    v-model="model"
    :placeholder="placeholder"
    :disabled="disabled"
    :rows="Number(rows)"
    :class="cn('w-full', props.class)"
  />
</template>
