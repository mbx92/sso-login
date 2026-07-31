<script setup>
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from '@lucide/vue'
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
  type: { type: String, default: 'error' },
  title: { type: String, default: 'Error' },
  message: { type: String, required: true },
  buttonText: { type: String, default: 'OK' },
})

const emit = defineEmits(['close', 'update:isOpen'])

const open = computed({
  get: () => props.isOpen,
  set: (value) => {
    if (!value) emit('close')
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
              'bg-destructive/10 text-destructive': type === 'error',
              'bg-brand-blue-200 text-brand-blue-deep': type === 'warning',
              'bg-success-bg text-success-text': type === 'success',
              'bg-primary/10 text-primary': type === 'info',
            }"
          >
            <AlertCircle v-if="type === 'error'" class="size-5" />
            <AlertTriangle v-else-if="type === 'warning'" class="size-5" />
            <CheckCircle2 v-else-if="type === 'success'" class="size-5" />
            <Info v-else class="size-5" />
          </div>
          <div class="space-y-1.5 text-left">
            <DialogTitle>{{ title }}</DialogTitle>
            <DialogDescription>{{ message }}</DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <DialogFooter>
        <Button class="w-full sm:w-auto" @click="emit('close')">
          {{ buttonText }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
