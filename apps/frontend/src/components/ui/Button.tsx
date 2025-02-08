import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white',
        danger: 'bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white',
        ghost: 'hover:bg-slate-800/50',
      },
      size: {
        sm: 'text-sm px-3 py-2',
        md: 'text-sm px-4 py-2',
        lg: 'text-base px-6 py-3',
        icon: 'w-8 h-8',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.memo(
  React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
      {
        className,
        variant,
        size,
        isLoading = false,
        leftIcon,
        rightIcon,
        children,
        disabled,
        ...props
      },
      ref
    ) => {
      return (
        <button
          className={cn(buttonVariants({ variant, size }), className)}
          ref={ref}
          disabled={isLoading || disabled}
          {...props}
        >
          {isLoading && (
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {!isLoading && leftIcon && (
            <span className="mr-2">{leftIcon}</span>
          )}
          {children}
          {!isLoading && rightIcon && (
            <span className="ml-2">{rightIcon}</span>
          )}
        </button>
      );
    }
  )
);

Button.displayName = 'Button';

export { Button, buttonVariants }; 