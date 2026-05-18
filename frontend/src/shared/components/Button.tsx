import { ButtonHTMLAttributes, forwardRef } from "react";
import GradientButton from "./ui/GradientButton";
import type { ButtonVariant } from "@/shared/theme/componentTokens";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
}

/**
 * Thin compatibility wrapper. Existing call sites pass `variant="primary"`,
 * `"secondary"`, or `"danger"` — those keep working, but the underlying
 * style is now `GradientButton` (gradient primary, soft outlined secondary,
 * rose-red gradient danger). Use `GradientButton` directly when you need
 * the extra `size` prop.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", isLoading, children, className, disabled, ...props }, ref) => (
    <GradientButton
      ref={ref}
      variant={variant}
      isLoading={isLoading}
      className={className}
      disabled={disabled}
      {...props}
    >
      {children}
    </GradientButton>
  ),
);

Button.displayName = "Button";
export default Button;
