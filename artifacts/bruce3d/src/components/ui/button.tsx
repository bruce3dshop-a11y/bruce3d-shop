import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0" +
" hover-elevate active-elevate-2",
  {
    variants: {
      variant: {
        default:
           // @replit: no hover, and add primary border
           "bg-primary text-primary-foreground border border-primary-border",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm border-destructive-border",
        outline:
          // @replit Shows the background color of whatever card / sidebar / accent background it is inside of.
          // Inherits the current text color. Uses shadow-xs. no shadow on active
          // No hover state
          " border [border-color:var(--button-outline)] shadow-xs active:shadow-none ",
        secondary:
          // @replit border, no hover, no shadow, secondary border.
          "border bg-secondary text-secondary-foreground border border-secondary-border ",
        // @replit no hover, transparent border
        ghost: "border border-transparent",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // @replit changed sizes
        default: "min-h-9 px-4 py-2",
        sm: "min-h-8 rounded-md px-3 text-xs",
        lg: "min-h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

interface Ripple { id: number; x: number; y: number; size: number }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onClick, children, ...props }, ref) => {
    const [ripples, setRipples] = React.useState<Ripple[]>([])

    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        const btn = e.currentTarget
        const rect = btn.getBoundingClientRect()
        const size = Math.max(rect.width, rect.height) * 2
        const x = e.clientX - rect.left - size / 2
        const y = e.clientY - rect.top - size / 2
        const id = Date.now() + Math.random()
        setRipples(prev => [...prev, { id, x, y, size }])
        setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 620)
        onClick?.(e)
      },
      [onClick]
    )

    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          onClick={onClick}
          {...props}
        >
          {children}
        </Slot>
      )
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }), "relative overflow-hidden")}
        ref={ref}
        onClick={handleClick}
        {...props}
      >
        {children}
        {ripples.map(({ id, x, y, size }) => (
          <span
            key={id}
            aria-hidden
            className="ripple-wave"
            style={{ left: x, top: y, width: size, height: size }}
          />
        ))}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
