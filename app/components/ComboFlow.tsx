"use client";

import { motion } from "framer-motion";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useCombo, type ComboStep } from "../hooks/useCombo";

interface ComboFlowProps {
  amountCusd: string;
  pickNumber: number;
}

/**
 * Optimistic sequential progress UI for the Play Today combo action (#92).
 */
export function ComboFlow({ amountCusd, pickNumber }: ComboFlowProps) {
  const { execute, step, progress, error, reset } = useCombo();
  
  const stepMessages: Record<ComboStep, string> = {
    idle: "",
    approving: "Approving cUSD...",
    saving: "Saving to Celo...",
    picking: "Picking number...",
    checking_in: "Updating streak...",
    success: "All set for tonight's draw! 🎉",
    error: "Failed to complete.",
  };

  if (step === "idle") {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={() => void execute(amountCusd, pickNumber)}
        className="w-full flex justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-celo-green to-[#2ebf73] px-4 py-4 text-lg font-bold text-white shadow-md shadow-celo-green/20 transition-all hover:shadow-lg hover:shadow-celo-green/30"
      >
        <span>Play Today (Save + Pick)</span>
      </motion.button>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3 rounded-xl border border-gray-100 glass-panel p-5 shadow-sm">
      <div className="flex items-center justify-between text-sm font-medium">
        <span className={step === "error" ? "text-red-500" : "text-gray-700"}>
          {step === "error" && error ? error : stepMessages[step]}
        </span>
        {step === "success" ? (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", bounce: 0.5 }}
          >
            <CheckCircle2 className="h-5 w-5 text-celo-green" />
          </motion.div>
        ) : step === "error" ? (
          <button onClick={reset} className="text-gray-400 underline hover:text-gray-600">Try again</button>
        ) : (
          <span className="text-gray-400">{progress}%</span>
        )}
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <motion.div
          className={`h-full ${step === "error" ? "bg-red-400" : "bg-celo-green"}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: "easeOut", duration: 0.5 }}
        />
      </div>
      
      {step !== "success" && step !== "error" && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Loader2 className="h-3 w-3 animate-spin text-celo-green" />
          <span>Please sign transactions in your wallet...</span>
        </div>
      )}
    </div>
  );
}
