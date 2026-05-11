import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
    {
        variants: {
            variant: {
                default: "bg-[#3B82F6] text-white hover:bg-[#2563EB] shadow-sm",
                destructive:
                    "bg-[#EF4444] text-white hover:bg-[#DC2626] shadow-sm",
                outline:
                    "border border-[#D1D5DB] bg-white text-[#111827] hover:bg-[#F9FAFB]",
                secondary:
                    "border border-[#D1D5DB] bg-white text-[#111827] hover:bg-[#F9FAFB]",
                ghost: "hover:bg-[#F3F4F6] hover:text-[#111827]",
                link: "text-[#3B82F6] underline-offset-4 hover:underline",
            },
            size: {
                default: "h-11 px-6 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-12 rounded-lg px-10 text-base",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)


const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
        <Comp
            className={cn(buttonVariants({ variant, size, className }))}
            ref={ref}
            {...props}
        />
    )
})
Button.displayName = "Button"

export { Button, buttonVariants }
