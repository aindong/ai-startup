import React, { useEffect, useCallback } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const modalVariants = cva(
  'bg-slate-900 rounded-xl shadow-xl ring-1 ring-white/10 w-full max-h-[90vh] overflow-hidden transform transition-all duration-200',
  {
    variants: {
      size: {
        sm: 'sm:max-w-[440px]',
        md: 'sm:max-w-[640px]',
        lg: 'lg:max-w-[940px]',
        xl: 'xl:max-w-[1024px]',
        full: 'sm:max-w-full sm:m-4',
      },
      isClosing: {
        true: 'scale-95 opacity-0',
        false: 'scale-100 opacity-100',
      },
    },
    defaultVariants: {
      size: 'md',
      isClosing: false,
    },
  }
);

export interface ModalProps extends VariantProps<typeof modalVariants> {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
}

const Modal = React.memo(
  ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size,
    closeOnOverlayClick = true,
    closeOnEsc = true,
  }: ModalProps) => {
    const [isClosing, setIsClosing] = React.useState(false);

    const handleClose = useCallback(() => {
      setIsClosing(true);
      setTimeout(onClose, 200); // Match the duration of the fade-out transition
    }, [onClose]);

    const handleKeyDown = useCallback(
      (event: KeyboardEvent) => {
        if (event.key === 'Escape' && closeOnEsc) {
          handleClose();
        }
      },
      [closeOnEsc, handleClose]
    );

    useEffect(() => {
      if (isOpen) {
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
      }

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
      };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) {
      return null;
    }

    return (
      <div
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200',
          isClosing ? 'opacity-0' : 'opacity-100'
        )}
        onClick={closeOnOverlayClick ? handleClose : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        <div
          className={cn(modalVariants({ size, isClosing }))}
          onClick={e => e.stopPropagation()}
        >
          {title && (
            <div className="p-6 flex items-center justify-between border-b border-white/5">
              <h2 id="modal-title" className="text-xl font-bold text-white">
                {title}
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className={cn(
                  'rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500'
                )}
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="p-6">{children}</div>

          {footer && (
            <div className="flex justify-end gap-3 px-6 py-4 bg-slate-800/50 border-t border-white/5">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Modal.displayName = 'Modal';

export { Modal, modalVariants }; 