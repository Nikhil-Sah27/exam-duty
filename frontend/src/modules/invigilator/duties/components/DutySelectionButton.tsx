import { Loader2, Plus } from "lucide-react";

interface DutySelectionButtonProps {
  onClick: () => void;
  isSubmitting: boolean;
  disabled?: boolean;
}

export default function DutySelectionButton({
  onClick,
  isSubmitting,
  disabled = false,
}: DutySelectionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isSubmitting}
      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-40"
    >
      {isSubmitting ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Selecting...
        </>
      ) : (
        <>
          <Plus className="h-3.5 w-3.5" />
          Select Duty
        </>
      )}
    </button>
  );
}
