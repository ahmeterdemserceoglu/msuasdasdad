import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '@/app/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {icon}
            </div>
          )}
          <input
            className={cn(
              'w-full rounded-md border border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'placeholder:text-gray-400 dark:placeholder:text-gray-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors duration-200',
              icon ? 'pl-10 pr-3 py-2' : 'px-3 py-2',
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
