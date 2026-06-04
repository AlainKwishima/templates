import React, { SelectHTMLAttributes } from 'react';
import { cn } from './Button';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-1.5">
            {label}
          </label>
        )}
        <select
          id={id}
          ref={ref}
          className={cn(
            "block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900",
            "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
            "transition-all duration-200 min-h-[44px] font-sans text-sm shadow-sm",
            error && "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/50",
            className
          )}
          {...props}
        >
          <option value="" disabled>Select an option</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1.5 text-xs font-semibold text-rose-500">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
