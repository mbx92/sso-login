<script setup>
import { computed, ref, watch } from 'vue'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const props = defineProps({
  modelValue: { type: [String, Number, Object], default: null },
  items: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Search...' },
  disabled: { type: Boolean, default: false },
  class: { type: [String, Object, Array], default: '' },
  by: { type: String, default: 'value' },
})

const emit = defineEmits(['update:modelValue'])

const query = ref('')

const normalized = computed(() =>
  (props.items || []).map((item) => {
    if (item == null) return { label: '', value: '' }
    if (typeof item !== 'object') return { label: String(item), value: item }
    return {
      label: item.label ?? item.name ?? item.email ?? String(item.value ?? item.id ?? ''),
      value: item.value ?? item.id ?? item,
      raw: item,
    }
  }),
)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return normalized.value.slice(0, 50)
  return normalized.value
    .filter((item) => item.label.toLowerCase().includes(q))
    .slice(0, 50)
})

const model = computed({
  get: () => {
    if (props.modelValue == null) return undefined
    if (typeof props.modelValue === 'object') {
      return String(props.modelValue.value ?? props.modelValue.id ?? '')
    }
    return String(props.modelValue)
  },
  set: (value) => {
    const match = normalized.value.find((item) => String(item.value) === String(value))
    emit('update:modelValue', match ? match.raw : value)
  },
})

watch(
  () => props.items,
  () => {
    query.value = ''
  },
)
</script>

<template>
  <div :class="cn('space-y-2 w-full', props.class)">
    <Input v-model="query" :placeholder="placeholder" :disabled="disabled" />
    <Select v-model="model" :disabled="disabled">
      <SelectTrigger class="w-full">
        <SelectValue :placeholder="placeholder" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          v-for="item in filtered"
          :key="String(item.value)"
          :value="String(item.value)"
        >
          {{ item.label }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
