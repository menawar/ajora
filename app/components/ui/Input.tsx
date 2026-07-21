import { InputHTMLAttributes, forwardRef, ReactNode } from "react";
import { Loader2, X } from "lucide-react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  prefixNode?: ReactNode;
  suffixNode?: ReactNode;
  loading?: boolean;
  onClear?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, prefixNode, suffixNode, loading, onClear, value, ...props }, ref) => {
    const hasValue = value !== undefined && value !== null && value !== "";
    
    return (
      <div className="flex flex-col gap-1 w-full">
        <div className="relative flex items-center w-full">
          {prefixNode && (
            <div className="absolute left-4 flex items-center justify-center text-text-muted">
              {prefixNode}
            </div>
          )}
          
          <input
            ref={ref}
            value={value}
            className={`w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-bg-secondary px-4 py-3.5 text-[15px] outline-none transition-all placeholder:text-gray-400 focus:border-celo-green focus:bg-bg-primary focus:ring-4 focus:ring-celo-green/10 ${
              error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
            } ${prefixNode ? "pl-11" : ""} ${suffixNode || loading || (hasValue && onClear) ? "pr-12" : ""} ${className}`}
            {...props}
          />

          <div className="absolute right-4 flex items-center justify-center gap-2 text-text-muted">
            {loading && <Loader2 className="w-4 h-4 animate-spin text-celo-green" />}
            {!loading && hasValue && onClear && (
              <button
                type="button"
                onClick={onClear}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Clear input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {!loading && suffixNode && suffixNode}
          </div>
        </div>
        
        {error && <span className="text-xs font-semibold text-red-500 px-1">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
