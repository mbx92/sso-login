<script setup>
import { AlertTriangle, Info } from '@lucide/vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  title: { type: String, default: 'Confirm' },
  message: { type: String, required: true },
  type: { type: String, default: 'info' },
  confirmText: { type: String, default: 'Confirm' },
  cancelText: { type: String, default: 'Cancel' },
})

const emit = defineEmits(['confirm', 'cancel', 'update:isOpen'])

const open = computed({
  get: () => props.isOpen,
  set: (value) => {
    if (!value) emit('cancel')
    emit('update:isOpen', value)
  },
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <div class="flex items-start gap-3">
          <div
            class="mt-0.5 flex size-10 items-center justify-center rounded-full"
            :class="{
              'bg-destructive/10 text-destructive': type === 'danger',
              'bg-brand-blue-200 text-brand-blue-deep': type === 'warning',
              'bg-primary/10 text-primary': type !== 'danger' && type !== 'warning',
            }"
          >
            <AlertTriangle v-if="type === 'danger' || type === 'warning'" class="size-5" />
            <Info v-else class="size-5" />
          </div>
          <div class="space-y-1.5 text-left">
            <DialogTitle>{{ title }}</DialogTitle>
            <DialogDescription>{{ message }}</DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <DialogFooter class="gap-2 sm:justify-end">
        <Button v-if="cancelText" variant="outline" @click="emit('cancel')">
          {{ cancelText }}
        </Button>
        <Button
          :variant="type === 'danger' ? 'destructive' : 'default'"
          @click="emit('confirm')"
        >
          {{ confirmText }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
