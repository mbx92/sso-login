import { cva } from "class-variance-authority";

export { default as Badge } from "./Badge.vue";

export const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-[13px] font-semibold leading-[1.5] w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-brand-blue-200 text-brand-blue-deep",
        destructive:
          "border-transparent bg-[#d45656]/10 text-[#d45656]",
        outline:
          "border-hairline bg-canvas text-steel",
        success:
          "border-transparent bg-success-bg text-success-text",
        new:
          "border-transparent bg-brand-coral text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
