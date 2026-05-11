import { Check } from "lucide-react";

const STEPS = ["Configuration", "Routine Builder", "Summary", "Room Assignment"];

interface StepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

export default function Stepper({ currentStep, onStepClick }: StepperProps) {
  return (
    <nav className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-gray-100">
      {STEPS.map((label, i) => {
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;

        return (
          <button
            key={label}
            onClick={() => {
              if (i <= currentStep) onStepClick(i);
            }}
            disabled={i > currentStep}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${
              isCurrent
                ? "text-blue-600"
                : isCompleted
                  ? "text-green-600 hover:text-green-700"
                  : "text-gray-400"
            } ${i > currentStep ? "cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                isCurrent
                  ? "bg-blue-600 text-white"
                  : isCompleted
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {isCompleted ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className="hidden sm:inline">{label}</span>

            {i < STEPS.length - 1 && (
              <div
                className={`mx-2 hidden h-px w-8 sm:block lg:w-16 ${
                  isCompleted ? "bg-green-300" : "bg-gray-200"
                }`}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
