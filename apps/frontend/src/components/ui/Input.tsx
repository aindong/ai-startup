import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const inputVariants = cva(
  'w-full rounded-lg px-4 py-3 text-white placeholder-slate-400 transition-colors duration-200',
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

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  error?: string;
  label?: string;
}

const Input = React.memo(
  React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, variant, error, label, ...props }, ref) => {
      return (
        <div className="space-y-2">
          {label && (
            <label className="block text-sm font-medium text-slate-300">
              {label}
            </label>
          )}
          <input
            ref={ref}
            className={cn(inputVariants({ variant, hasError: !!error }), className)}
            {...props}
          />
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
        </div>
      );
    }
  )
);

Input.displayName = 'Input';

export { Input, inputVariants }; 