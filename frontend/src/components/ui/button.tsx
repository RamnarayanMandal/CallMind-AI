import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base styles
  [
    "inline-flex shrink-0 items-center justify-center gap-1.5",
    "rounded-lg border border-transparent",
    "text-sm font-medium whitespace-nowrap",
    "transition-all duration-200 outline-none select-none",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.98]",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        /* Primary — solid blue */
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-glow-sm",

        /* Blue → Purple gradient */
        gradient:
          "bg-gradient-brand text-white border-transparent shadow-sm hover:opacity-90 hover:shadow-glow-sm",

        /* Outline — blue border on hover */
        outline:
          "border-border bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/40 dark:border-input dark:bg-input/30 dark:hover:bg-input/50",

        /* Secondary — solid purple */
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",

        /* Ghost — transparent with blue/purple hover tint */
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-muted/50",

        /* Destructive — minimal red */
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/30 focus-visible:ring-destructive/40",

        /* Link — blue underline */
        link:
          "text-primary underline-offset-4 hover:underline hover:text-primary/80",
      },
      size: {
        xs:      "h-6 px-2 text-xs rounded-md [&_svg:not([class*='size-'])]:size-3",
        sm:      "h-8 px-3 text-xs rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        default: "h-9 px-4",
        lg:      "h-11 px-6 text-base rounded-xl",
        xl:      "h-12 px-8 text-base rounded-xl font-semibold",
        icon:    "size-9",
        "icon-sm":  "size-8 rounded-md",
        "icon-xs":  "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-lg":  "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
