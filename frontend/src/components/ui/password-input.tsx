import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "./input"
import { cn } from "@/lib/utils"

export type PasswordInputProps = React.ComponentProps<"input">

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)

    return (
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          className={cn("pr-12 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden", className)}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-0 top-0 h-full px-4 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center rounded-r-full"
          tabIndex={-1} // Prevent tabbing to the eye icon to not disrupt form flow, or keep it if accessibility demands it. We'll leave it out of tab flow for simpler UX.
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      </div>
    )
  }
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
