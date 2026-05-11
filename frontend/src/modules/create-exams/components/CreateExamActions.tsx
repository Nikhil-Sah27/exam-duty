import { Plus } from "lucide-react";

export default function CreateExamActions() {
  const handleClick = () => {
    console.log("Feature coming soon");
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
    >
      <Plus className="h-4 w-4" /> Create Exam Setup
    </button>
  );
}
