import { TextareaHTMLAttributes, forwardRef } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`w-full rounded-xl border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-celo-green/50 ${error ? "border-red-500 bg-red-50/50" : "border-gray-200 hover:border-gray-300 bg-white"} ${className}`}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
