<script setup>
import { useVModel } from "@vueuse/core";
import { cn } from "@/lib/utils";

const props = defineProps({
  class: { type: null, required: false },
  defaultValue: { type: [String, Number], required: false },
  modelValue: { type: [String, Number], required: false },
});

const emits = defineEmits(["update:modelValue"]);

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
});
</script>

<template>
  <textarea
    v-model="modelValue"
    data-slot="textarea"
    :class="
      cn(
        'border-hairline placeholder:text-steel focus-visible:border-brand-blue-deep focus-visible:border-2 focus-visible:ring-0 aria-invalid:border-[#d45656] flex field-sizing-content min-h-16 w-full rounded-md border bg-canvas px-4 py-3 text-base text-ink shadow-none transition-[border-color] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-[16px]',
        props.class,
      )
    "
  />
</template>
