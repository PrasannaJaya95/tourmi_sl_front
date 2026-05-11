import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, error, ...props }, ref) => {
    return (
        <input
            type={type}
            className={cn(
                "flex h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/20 focus-visible:border-[#3B82F6] disabled:cursor-not-allowed disabled:opacity-50",
                error && "border-[#EF4444] bg-[#FEF2F2] focus-visible:ring-[#EF4444]/20 focus-visible:border-[#EF4444]",
                className
            )}
            ref={ref}
            {...props}
        />
    )
})

Input.displayName = "Input"

export { Input }
