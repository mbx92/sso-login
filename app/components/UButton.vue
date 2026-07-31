<script setup>
import { computed, useAttrs } from 'vue'
import * as LucideIcons from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  color: { type: String, default: 'primary' },
  variant: { type: String, default: 'solid' },
  size: { type: String, default: 'md' },
  icon: { type: String, default: null },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  type: { type: String, default: 'button' },
  class: { type: [String, Object, Array], default: '' },
})

const attrs = useAttrs()

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

const mappedVariant = computed(() => {
  if (props.variant === 'ghost') return 'ghost'
  if (props.variant === 'link') return 'link'
  if (props.variant === 'outline' || props.variant === 'soft' || props.variant === 'subtle') {
    if (props.color === 'error' || props.color === 'red' || props.color === 'destructive') return 'destructive'
    return props.variant === 'outline' ? 'outline' : 'secondary'
  }
  if (props.color === 'error' || props.color === 'red' || props.color === 'destructive') return 'destructive'
  if (props.color === 'neutral' || props.color === 'gray') return 'secondary'
  return 'default'
})

const mappedSize = computed(() => {
  if (props.size === 'xs') return 'xs'
  if (props.size === 'sm') return 'sm'
  if (props.size === 'lg' || props.size === 'xl') return 'lg'
  if (props.icon && !attrs.default && false) return 'icon'
  return 'default'
})
</script>

<template>
  <Button
    :type="type"
    :variant="mappedVariant"
    :size="mappedSize"
    :disabled="disabled || loading"
    :class="cn(props.class)"
    v-bind="attrs"
  >
    <LucideIcons.Loader2 v-if="loading" class="size-4 animate-spin" />
    <component :is="Icon" v-else-if="Icon" class="size-4" />
    <slot />
  </Button>
</template>
