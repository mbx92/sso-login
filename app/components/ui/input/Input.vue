<script setup>
import { useVModel } from "@vueuse/core";
import { cn } from "@/lib/utils";

const props = defineProps({
  defaultValue: { type: [String, Number], required: false },
  modelValue: { type: [String, Number], required: false },
  class: { type: null, required: false },
});

const emits = defineEmits(["update:modelValue"]);

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
});
</script>

<template>
  <input
    v-model="modelValue"
    data-slot="input"
    :class="
      cn(
        'file:text-foreground placeholder:text-steel selection:bg-primary selection:text-primary-foreground border-hairline h-11 w-full min-w-0 rounded-md border bg-canvas px-4 py-3 text-base text-ink shadow-none transition-[border-color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-[16px]',
        'focus-visible:border-brand-blue-deep focus-visible:border-2 focus-visible:ring-0',
        'aria-invalid:border-[#d45656]',
        props.class,
      )
    "
  />
</template>
