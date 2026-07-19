import { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        <input
          ref={ref}
          className={`w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-lg outline-none transition-all placeholder:text-gray-400 focus:border-celo-green focus:bg-white focus:ring-2 focus:ring-celo-green/20 ${
            error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
          } ${className}`}
          {...props}
        />
        {error && <span className="text-sm text-red-500 px-1">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
