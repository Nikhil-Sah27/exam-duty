type BadgeVariant = "blue" | "yellow" | "green" | "gray";

interface StatusBadgeProps {
  label: string;
  variant: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  blue: "bg-blue-100 text-blue-700",
  yellow: "bg-yellow-100 text-yellow-700",
  green: "bg-green-100 text-green-700",
  gray: "bg-gray-100 text-gray-700",
};

export default function StatusBadge({ label, variant }: StatusBadgeProps) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-medium ${variantStyles[variant]}`}
    >
      {label}
    </span>
  );
}
