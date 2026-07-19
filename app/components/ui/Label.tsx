import { LabelHTMLAttributes, forwardRef } from "react";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`text-sm font-medium text-gray-700 ${className}`}
        {...props}
      >
        {children}
      </label>
    );
  }
);
Label.displayName = "Label";
