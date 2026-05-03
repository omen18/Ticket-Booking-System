import { cn } from "@/lib/utils/cn";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps?: number;
}

export default function StepIndicator({ currentStep, totalSteps = 3 }: StepIndicatorProps) {
  const steps = Array.from({ length: totalSteps }, (_, index) => index + 1);

  return (
    <ol className="flex items-center">
      {steps.map((step, index) => {
        const isCompleted = step < currentStep;
        const isActive = step === currentStep;

        return (
          <li key={step} className="flex items-center">
            <div
              className={cn(
                "neu-raised flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold",
                isCompleted && "bg-brand-indigo text-white shadow-none",
                isActive && "ring-2 ring-brand-indigo text-brand-navy",
                !isCompleted && !isActive && "text-zinc-500",
              )}
            >
              {step}
            </div>

            {index !== totalSteps - 1 ? (
              <span
                className={cn(
                  "mx-2 h-[2px] w-12 rounded-full bg-zinc-300",
                  isCompleted && "bg-brand-indigo",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
