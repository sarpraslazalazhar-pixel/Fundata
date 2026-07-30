import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface StepItem {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: string[] | StepItem[];
  activeStep: number;
  className?: string;
}

export function Stepper({ steps, activeStep, className }: StepperProps) {
  const normalizedSteps: StepItem[] = steps.map((step) =>
    typeof step === 'string' ? { label: step } : step
  );

  const progressPercentage = (activeStep / (normalizedSteps.length - 1)) * 100;

  return (
    <div className={cn("flex items-center justify-between w-full relative", className)}>
      {/* Background Line */}
      <div className="absolute top-4 left-0 w-full h-[2px] bg-slate-200 z-0" />
      
      {/* Animated Active Line */}
      <motion.div
        className="absolute top-4 left-0 h-[2px] bg-blue-600 z-0 origin-left"
        initial={{ width: '0%' }}
        animate={{ width: `${progressPercentage}%` }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />

      {normalizedSteps.map((step, index) => {
        const isActive = index === activeStep;
        const isCompleted = index < activeStep;

        return (
          <div key={step.label} className="flex flex-col items-center z-10 relative flex-1 px-1">
            <motion.div
              animate={{
                scale: isActive ? 1.15 : 1,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ring-4 ring-white shadow-sm",
                isCompleted ? "bg-blue-600 text-white" : isActive ? "bg-blue-600 text-white ring-blue-100" : "bg-slate-200 text-slate-500"
              )}
            >
              {isCompleted ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <Check className="w-5 h-5" />
                </motion.div>
              ) : (
                <span className="font-semibold text-xs">{index + 1}</span>
              )}
            </motion.div>

            <span className={cn(
              "mt-2 text-xs font-medium text-center transition-colors duration-200",
              isActive || isCompleted ? "text-slate-900 font-semibold" : "text-slate-500"
            )}>
              {step.label}
            </span>
            {step.description && (
              <span className="text-[10px] text-slate-400 text-center mt-0.5 max-w-[96px] leading-tight">
                {step.description}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
