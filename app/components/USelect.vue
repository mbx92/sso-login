<script setup>
import { computed } from 'vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const props = defineProps({
  modelValue: { type: [String, Number, Boolean, Object], default: null },
  items: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Select...' },
  disabled: { type: Boolean, default: false },
  class: { type: [String, Object, Array], default: '' },
})

const emit = defineEmits(['update:modelValue'])

const NULL_VALUE = '__null__'

const normalized = computed(() =>
  (props.items || []).map((item) => {
    if (item == null) return { label: '', value: NULL_VALUE }
    if (typeof item !== 'object') {
      return { label: String(item), value: item == null ? NULL_VALUE : String(item), raw: item }
    }
    const raw = item.value ?? item.id ?? item.label
    return {
      label: item.label ?? item.name ?? String(raw ?? ''),
      value: raw == null ? NULL_VALUE : String(raw),
      raw,
      disabled: !!item.disabled,
    }
  }),
)

const model = computed({
  get: () => {
    if (props.modelValue == null) return NULL_VALUE
    return String(props.modelValue)
  },
  set: (value) => {
    if (value === NULL_VALUE) {
      emit('update:modelValue', null)
      return
    }
    const match = normalized.value.find((item) => item.value === String(value))
    emit('update:modelValue', match ? match.raw : value)
  },
})
</script>

<template>
  <Select v-model="model" :disabled="disabled">
    <SelectTrigger :class="cn('w-full', props.class)">
      <SelectValue :placeholder="placeholder" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem
        v-for="item in normalized"
        :key="item.value"
        :value="item.value"
        :disabled="item.disabled"
      >
        {{ item.label }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>
