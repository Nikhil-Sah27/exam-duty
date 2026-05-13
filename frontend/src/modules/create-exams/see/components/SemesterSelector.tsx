import Select from "@/shared/components/Select";

const SEMESTERS = Array.from({ length: 8 }, (_, i) => ({
  value: String(i + 1),
  label: `Semester ${i + 1}`,
}));

interface SemesterSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function SemesterSelector({
  value,
  onChange,
  disabled,
}: SemesterSelectorProps) {
  return (
    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <Select
        label="Select Semester"
        options={[{ value: "", label: "Select semester" }, ...SEMESTERS]}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </section>
  );
}
