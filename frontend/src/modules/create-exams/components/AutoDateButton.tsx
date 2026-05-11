import { Zap } from "lucide-react";
import Button from "@/shared/components/Button";

interface AutoDateButtonProps {
  disabled: boolean;
  onClick: () => void;
}

export default function AutoDateButton({ disabled, onClick }: AutoDateButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5"
    >
      <Zap className="h-4 w-4" /> Auto
    </Button>
  );
}
