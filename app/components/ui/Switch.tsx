import { forwardRef } from "react";
import { motion } from "framer-motion";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onChange, disabled }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-celo-green focus:ring-offset-2 ${checked ? "bg-celo-green" : "bg-gray-200"} ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      >
        <motion.span
          className="inline-block h-5 w-5 rounded-full bg-white shadow-sm"
          animate={{ x: checked ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    );
  }
);
Switch.displayName = "Switch";
