import { ButtonHTMLAttributes, forwardRef } from "react";
import { buttonVariants, type ButtonVariant } from "@/shared/theme/componentTokens";

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizing: Record<NonNullable<GradientButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
};

/**
 * Premium button primitive. The shared `Button` component delegates here so
 * existing call sites pick up the upgraded styling without prop changes.
 * Use this directly when you want explicit access to size / variant.
 */
const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  (
    {
      variant = "primary",
      isLoading,
      size = "md",
      children,
      className = "",
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all duration-200 active:scale-[0.98] ${sizing[size]} ${buttonVariants[variant]} ${className}`}
        {...props}
      >
        {isLoading ? "Loading..." : children}
      </button>
    );
  },
);

GradientButton.displayName = "GradientButton";
export default GradientButton;
