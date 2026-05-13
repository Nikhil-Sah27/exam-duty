import Input from "@/shared/components/Input";

interface TimeRangePickerProps {
  startTime: string;
  endTime: string;
  onStartChange: (t: string) => void;
  onEndChange: (t: string) => void;
  disabled?: boolean;
}

export default function TimeRangePicker({
  startTime,
  endTime,
  onStartChange,
  onEndChange,
  disabled,
}: TimeRangePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Input
        label="Start Time"
        type="time"
        value={startTime}
        onChange={(e) => onStartChange(e.target.value)}
        disabled={disabled}
      />
      <Input
        label="End Time"
        type="time"
        value={endTime}
        onChange={(e) => onEndChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}
