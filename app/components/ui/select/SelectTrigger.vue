<script setup>
import { ChevronDown } from "@lucide/vue";
import { reactiveOmit } from "@vueuse/core";
import { SelectIcon, SelectTrigger, useForwardProps } from "reka-ui";
import { cn } from "@/lib/utils";

const props = defineProps({
  disabled: { type: Boolean, required: false },
  reference: { type: null, required: false },
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
  class: { type: null, required: false },
  size: { type: String, required: false, default: "default" },
});

const delegatedProps = reactiveOmit(props, "class", "size");
const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <SelectTrigger
    data-slot="select-trigger"
    :data-size="size"
    v-bind="forwardedProps"
    :class="
      cn(
        `border-hairline data-[placeholder]:text-steel [&_svg:not([class*='text-'])]:text-steel focus-visible:border-brand-blue-deep focus-visible:border-2 focus-visible:ring-0 aria-invalid:border-[#d45656] flex w-full items-center justify-between gap-2 rounded-md border bg-canvas px-4 py-2 text-[15px] text-ink whitespace-nowrap shadow-none transition-[border-color] outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-11 data-[size=sm]:h-9 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4`,
        props.class,
      )
    "
  >
    <slot />
    <SelectIcon as-child>
      <ChevronDown class="size-4 opacity-50" />
    </SelectIcon>
  </SelectTrigger>
</template>
