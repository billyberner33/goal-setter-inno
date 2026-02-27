import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkflowProgressProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const steps = [
  { number: 1, label: "Select Metric" },
  { number: 2, label: "Comparable Schools" },
  { number: 3, label: "Peer Trends" },
  { number: 4, label: "Goal Range" },
  { number: 5, label: "Set Goal" },
];

const WorkflowProgress = ({ currentStep, onStepClick }: WorkflowProgressProps) => {
  return (
    <div className="flex items-center gap-1 w-full max-w-2xl mx-auto py-4">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center flex-1">
          <button
            onClick={() => onStepClick?.(step.number)}
            disabled={step.number > currentStep}
            className="flex items-center gap-2 group"
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all shrink-0",
                step.number < currentStep && "bg-primary text-primary-foreground",
                step.number === currentStep && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                step.number > currentStep && "bg-muted text-muted-foreground"
              )}
            >
              {step.number < currentStep ? <Check size={14} /> : step.number}
            </div>
            <span
              className={cn(
                "text-xs font-medium hidden lg:block whitespace-nowrap",
                step.number <= currentStep ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </button>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "h-0.5 flex-1 mx-2 rounded-full",
                step.number < currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default WorkflowProgress;
