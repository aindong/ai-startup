import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const selectVariants = cva(
  'w-full rounded-lg px-4 py-3 text-white transition-colors duration-200 appearance-none bg-no-repeat bg-[right_1rem_center]',
  {
    variants: {
      variant: {
        default: 'bg-slate-800/50 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500',
        ghost: 'bg-transparent focus:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500',
      },
      hasError: {
        true: 'border border-red-500 focus:ring-red-500',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      hasError: false,
    },
  }
);

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof selectVariants> {
  options: SelectOption[];
  error?: string;
  label?: string;
  placeholder?: string;
}

const Select = React.memo(
  React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ 
      className, 
      variant, 
      error, 
      label, 
      options,
      placeholder,
      ...props 
    }, ref) => {
      return (
        <div className="space-y-2">
          {label && (
            <label className="block text-sm font-medium text-slate-300">
              {label}
            </label>
          )}
          <div className="relative">
            <select
              ref={ref}
              className={cn(selectVariants({ variant, hasError: !!error }), className)}
              {...props}
            >
              {placeholder && (
                <option value="" disabled>
                  {placeholder}
                </option>
              )}
              {options.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
        </div>
      );
    }
  )
);

Select.displayName = 'Select';

export { Select, selectVariants }; 