export type RoomMode = "single" | "range";

interface ModeToggleProps {
  mode: RoomMode;
  onChange: (mode: RoomMode) => void;
}

export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex rounded-lg bg-gray-100 p-1">
      <button
        type="button"
        onClick={() => onChange("range")}
        className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
          mode === "range"
            ? "bg-white text-gray-800 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Range (Bulk)
      </button>
      <button
        type="button"
        onClick={() => onChange("single")}
        className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
          mode === "single"
            ? "bg-white text-gray-800 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Single Room
      </button>
    </div>
  );
}
