import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50",
  secondary:
    "border border-gray-300 text-gray-700 hover:bg-gray-50",
  danger:
    "bg-red-600 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", isLoading, children, className = "", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`rounded px-4 py-2 text-sm font-medium transition-colors ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading ? "Loading..." : children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
