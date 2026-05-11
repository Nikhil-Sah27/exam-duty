export default function StatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-2.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        Duty Status
      </span>
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
        <span className="text-xs text-gray-600">Not Assigned</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
        <span className="text-xs text-gray-600">Partially Assigned</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
        <span className="text-xs text-gray-600">Fully Assigned</span>
      </div>
    </div>
  );
}
