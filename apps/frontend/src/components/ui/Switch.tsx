import React from 'react';
import { cn } from '../../lib/utils';

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

export const Switch = React.memo(
  React.forwardRef<HTMLInputElement, SwitchProps>(
    ({ className, label, description, ...props }, ref) => {
      const id = React.useId();

      return (
        <div className={cn('flex items-center justify-between gap-3', className)}>
          <div className="flex flex-col">
            {label && (
              <label 
                htmlFor={id}
                className="text-sm font-medium text-slate-300"
              >
                {label}
              </label>
            )}
            {description && (
              <span className="text-xs text-slate-400">
                {description}
              </span>
            )}
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              ref={ref}
              type="checkbox"
              id={id}
              className="sr-only peer"
              {...props}
            />
            <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>
      );
    }
  )
);

Switch.displayName = 'Switch'; 