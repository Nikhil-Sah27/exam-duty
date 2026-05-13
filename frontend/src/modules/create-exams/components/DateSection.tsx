import { AlertTriangle, XCircle } from "lucide-react";
import Input from "@/shared/components/Input";
import AutoDateButton from "./AutoDateButton";
import { formatDate } from "../utils/dateUtils";
import type { DateInfo } from "../services/examScheduling";

interface DateSectionProps {
  startDate: string;
  endDate: string;
  today: string;
  isAutoDate: boolean;
  canAutoCalculate: boolean;
  dateError: string | null;
  examDates: string[];
  skippedSundays: string[];
  dateInfo: DateInfo | null;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onAutoCalculate: () => void;
}

export default function DateSection({
  startDate,
  endDate,
  today,
  isAutoDate,
  canAutoCalculate,
  dateError,
  examDates,
  skippedSundays,
  dateInfo,
  onStartDateChange,
  onEndDateChange,
  onAutoCalculate,
}: DateSectionProps) {
  return (
    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">Exam Dates</h3>

      {/* Date inputs + Auto button */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-48">
          <Input
            label="Start Date"
            type="date"
            min={today}
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>

        <AutoDateButton disabled={!canAutoCalculate} onClick={onAutoCalculate} />

        <div className="w-48">
          <Input
            label="End Date"
            type="date"
            min={startDate || today}
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
        </div>

        {endDate && !dateError && (
          <span
            className={`self-end rounded-md px-2 py-1.5 text-xs font-medium ${
              isAutoDate
                ? "bg-green-50 text-green-600"
                : "bg-amber-50 text-amber-600"
            }`}
          >
            {isAutoDate ? "Auto-calculated" : "Manual override"}
          </span>
        )}
      </div>

      {/* Validation error banner */}
      {dateError && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <XCircle className="h-4 w-4 shrink-0 text-red-500" />
          <p className="text-xs font-medium text-red-600">{dateError}</p>
        </div>
      )}

      {/* Sunday skip warning */}
      {skippedSundays.length > 0 && !dateError && (
        <div className="mt-3 flex items-start gap-1.5 text-xs text-amber-600">
          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
          <span>
            {skippedSundays.length} Sunday{skippedSundays.length > 1 ? "s" : ""} skipped:{" "}
            {skippedSundays.map(formatDate).join(", ")}
          </span>
        </div>
      )}

      {/* Generated dates display */}
      {examDates.length > 0 && !dateError && (
        <div className="mt-3 flex flex-wrap gap-2">
          {examDates.map((d) => (
            <span
              key={d}
              className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600"
            >
              {formatDate(d)}
            </span>
          ))}
        </div>
      )}

      {/* Slot summary line */}
      {dateInfo && examDates.length > 0 && !dateError && (
        <p className="mt-3 text-xs text-gray-500">
          {dateInfo.requiredDays} day(s) &times; {dateInfo.shiftsPerDay} shift(s) ={" "}
          <span className="font-semibold text-gray-700">{dateInfo.totalSlots} slots</span>
          {dateInfo.extraSlots > 0 && (
            <> &mdash; <span className="text-amber-600">{dateInfo.extraSlots} extra</span></>
          )}
          {dateInfo.extraSlots < 0 && (
            <> &mdash; <span className="text-red-600">{Math.abs(dateInfo.extraSlots)} short</span></>
          )}
        </p>
      )}
    </section>
  );
}
