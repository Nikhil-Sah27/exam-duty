import { ClipboardList } from "lucide-react";

export default function CIEWorkflowPlaceholder() {
  return (
    <div className="rounded-xl border-2 border-dashed border-gray-200 py-16">
      <div className="flex flex-col items-center">
        <div className="rounded-full bg-blue-50 p-3">
          <ClipboardList className="h-6 w-6 text-blue-400" />
        </div>
        <p className="mt-4 text-sm font-medium text-gray-600">
          CIE Exam Setup
        </p>
        <p className="mt-1 text-xs text-gray-400">
          CIE workflow will be added here
        </p>
      </div>
    </div>
  );
}
