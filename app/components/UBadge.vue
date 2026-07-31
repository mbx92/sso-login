<script setup>
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const props = defineProps({
  color: { type: String, default: 'primary' },
  variant: { type: String, default: 'solid' },
  class: { type: [String, Object, Array], default: '' },
})

const mappedVariant = computed(() => {
  if (props.color === 'error' || props.color === 'red' || props.color === 'destructive') {
    return 'destructive'
  }
  if (props.color === 'success' || props.color === 'green') {
    return 'success'
  }
  if (props.variant === 'outline') return 'outline'
  if (props.variant === 'subtle' || props.variant === 'soft' || props.color === 'neutral' || props.color === 'gray') {
    return 'secondary'
  }
  return 'default'
})
</script>

<template>
  <Badge :variant="mappedVariant" :class="cn(props.class)">
    <slot />
  </Badge>
</template>
