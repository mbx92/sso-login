import { cva } from "class-variance-authority";

export { default as Button } from "./Button.vue";

/* MiniMax: pill buttons, black primary, outline secondary.
   rounded-[var(--radius-pill)] (not rounded-full) so the IBM Carbon theme can square it off. */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-pill)] text-[14px] font-semibold leading-[1.4] transition-colors duration-150 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-deep/30 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground active:bg-charcoal disabled:bg-hairline disabled:text-muted",
        destructive:
          "bg-destructive text-white active:bg-destructive/90 disabled:bg-hairline disabled:text-muted",
        outline:
          "border border-ink bg-transparent text-ink active:bg-surface disabled:border-hairline disabled:text-muted",
        secondary:
          "border border-hairline bg-canvas text-ink active:bg-surface disabled:text-muted",
        ghost:
          "bg-transparent text-ink active:bg-surface",
        link:
          "rounded-none px-0 text-[14px] font-medium text-ink underline-offset-4 active:underline",
      },
      size: {
        default: "h-10 px-6 py-[11px]",
        xs: "h-7 gap-1 px-3 text-xs",
        sm: "h-9 gap-1.5 px-4",
        lg: "h-11 px-7",
        icon: "size-9 border border-hairline bg-canvas text-ink",
        "icon-xs": "size-6 border border-hairline bg-canvas",
        "icon-sm": "size-9 border border-hairline bg-canvas text-ink",
        "icon-lg": "size-11 border border-hairline bg-canvas text-ink",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
