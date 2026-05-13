import Input from "@/shared/components/Input";

interface ExamDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  min?: string;
  disabled?: boolean;
}

export default function ExamDatePicker({
  value,
  onChange,
  min,
  disabled,
}: ExamDatePickerProps) {
  return (
    <Input
      label="Exam Date"
      type="date"
      value={value}
      min={min}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  );
}
