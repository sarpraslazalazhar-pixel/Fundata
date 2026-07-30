import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { Building2, HeartHandshake, Coins, Building } from 'lucide-react';
import { DynamicIcon } from '@/Components/DynamicIcon';

const divisiIcons: Record<string, React.ReactNode> = {
  sekretariat: <Building2 className="w-6 h-6 mb-2 text-current" />,
  laz: <HeartHandshake className="w-6 h-6 mb-2 text-current" />,
  keuangan: <Coins className="w-6 h-6 mb-2 text-current" />,
};

function getIconForOption(opt: any, labelKey: string) {
  if (opt.icon) {
    return <DynamicIcon name={opt.icon} className="w-6 h-6 mb-2 text-current" />;
  }
  const label = opt[labelKey] || '';
  const key = Object.keys(divisiIcons).find(k => label.toLowerCase().includes(k));
  return key ? divisiIcons[key] : <Building className="w-6 h-6 mb-2 text-current" />;
}

interface RadioCardGridProps {
  options: any[];
  value: string | number;
  onChange: (value: string) => void;
  labelKey: string;
  valueKey?: string;
  disabled?: boolean;
  showIcon?: boolean;
  emptyMessage?: string;
  groupId?: string;
}

export function RadioCardGrid({
  options,
  value,
  onChange,
  labelKey,
  valueKey = 'id',
  disabled = false,
  showIcon = false,
  emptyMessage = 'Tidak ada pilihan tersedia.',
  groupId,
}: RadioCardGridProps) {
  const generatedId = useId();
  const activeLayoutId = groupId || `radio-grid-active-${generatedId}`;

  if (!options?.length) {
    return <p className="text-sm text-gray-500 italic p-3 bg-slate-50 border rounded-lg">{emptyMessage}</p>;
  }

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {options.map((opt: any) => {
        const optValue = String(opt[valueKey]);
        const isSelected = value === optValue;

        return (
          <motion.button
            key={optValue}
            type="button"
            disabled={disabled}
            onClick={() => onChange(optValue)}
            whileHover={!disabled ? { scale: 1.02, y: -2 } : undefined}
            whileTap={!disabled ? { scale: 0.97 } : undefined}
            className={`relative flex-1 basis-[150px] max-w-[220px] p-3 border rounded-xl text-center flex flex-col items-center justify-center min-h-[4.5rem] font-medium text-sm transition-colors duration-200 outline-none
              ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400' :
              isSelected ? 'border-blue-600 text-white shadow-md' :
              'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-600 shadow-sm'}
            `}
          >
            {/* Animated Sliding Background Indicator */}
            {isSelected && (
              <motion.div
                layoutId={activeLayoutId}
                className="absolute inset-0 bg-blue-600 rounded-xl z-0"
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 30,
                }}
              />
            )}

            {/* Content Layer (above the animated background) */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              {showIcon && getIconForOption(opt, labelKey)}
              <span>{opt[labelKey]}</span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
