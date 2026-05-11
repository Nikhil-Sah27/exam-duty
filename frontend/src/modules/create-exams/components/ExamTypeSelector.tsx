import { ClipboardList, GraduationCap } from "lucide-react";
import ExamTypeCard from "./ExamTypeCard";

export type ExamFlow = "CIE" | "SEE";

interface ExamTypeSelectorProps {
  selected: ExamFlow | null;
  onSelect: (type: ExamFlow) => void;
}

export default function ExamTypeSelector({
  selected,
  onSelect,
}: ExamTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <ExamTypeCard
        title="CIE — Internal Exams"
        description="IA1, IA2, IA3 exams"
        icon={ClipboardList}
        selected={selected === "CIE"}
        onClick={() => onSelect("CIE")}
      />
      <ExamTypeCard
        title="SEE — External Exams"
        description="Final semester exams"
        icon={GraduationCap}
        selected={selected === "SEE"}
        onClick={() => onSelect("SEE")}
      />
    </div>
  );
}
