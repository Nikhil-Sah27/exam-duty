import { ArrowRight, Loader2 } from "lucide-react";

interface ViewDutyGroupButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  label?: string;
}

/**
 * The CTA that opens the duty-group details modal from a classroom view.
 * Same gradient as the DCS/RS Select Duty hero so the action reads as
 * "go to the group flow" rather than a per-room button.
 */
export default function ViewDutyGroupButton({
  onClick,
  isLoading = false,
  disabled = false,
  label = "View Duty Group",
}: ViewDutyGroupButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading...
        </>
      ) : (
        <>
          {label}
          <ArrowRight className="h-3.5 w-3.5" />
        </>
      )}
    </button>
  );
}
