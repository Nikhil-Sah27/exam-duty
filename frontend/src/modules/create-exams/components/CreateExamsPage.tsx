import { useState } from "react";
import CreateExamHeader from "./CreateExamHeader";
import ExamTypeSelector, { type ExamFlow } from "./ExamTypeSelector";
import CIEPage from "../pages/CIEPage";
import SEEWorkflowPlaceholder from "./SEEWorkflowPlaceholder";

export default function CreateExamsPage() {
  const [selected, setSelected] = useState<ExamFlow | null>(null);

  return (
    <div className="space-y-6">
      <CreateExamHeader />
      <ExamTypeSelector selected={selected} onSelect={setSelected} />

      {selected === null && (
        <p className="pt-4 text-center text-sm text-gray-400">
          Select an exam type above to begin
        </p>
      )}
      {selected === "CIE" && <CIEPage />}
      {selected === "SEE" && <SEEWorkflowPlaceholder />}
    </div>
  );
}
