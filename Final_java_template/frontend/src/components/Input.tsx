import React, { InputHTMLAttributes } from 'react';
import { cn } from './Button';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-1.5">
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={cn(
            "block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900",
            "placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
            "transition-all duration-200 min-h-[44px] font-sans text-sm shadow-sm",
            error && "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/50",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs font-semibold text-rose-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
