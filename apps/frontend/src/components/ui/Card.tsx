import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const cardVariants = cva(
  'bg-slate-900/90 backdrop-blur shadow-xl ring-1 ring-white/10 rounded-xl',
  {
    variants: {
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      padding: 'md',
    },
  }
);

export interface CardProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  title?: React.ReactNode;
  indicator?: {
    color: string;
    pulse?: boolean;
  };
  action?: React.ReactNode;
}

export const Card = React.memo(
  React.forwardRef<HTMLDivElement, CardProps>(
    ({ 
      className, 
      title, 
      indicator,
      action,
      padding,
      children,
      ...props 
    }, ref) => {
      return (
        <div
          ref={ref}
          className={cn(cardVariants({ padding }), className)}
          {...props}
        >
          {(title || action) && (
            <div className="flex items-center justify-between mb-4">
              {title && (
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  {indicator && (
                    <div 
                      className={cn(
                        'w-3 h-3 rounded-full',
                        indicator.color,
                        indicator.pulse && 'animate-pulse'
                      )} 
                    />
                  )}
                  {title}
                </h2>
              )}
              {action}
            </div>
          )}
          {children}
        </div>
      );
    }
  )
);

Card.displayName = 'Card'; 