"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface ToggleItemProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action: ReactNode;
  onClick?: () => void;
  borderBottom?: boolean;
}

export function ToggleItem({
  icon,
  title,
  description,
  action,
  onClick,
  borderBottom = true,
}: ToggleItemProps) {
  const content = (
    <>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-bg-secondary text-text-secondary group-hover:text-celo-green group-hover:bg-celo-green/10 transition-colors shrink-0">
          {icon}
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-sm font-bold text-text-primary truncate">{title}</span>
          {description && (
            <span className="text-xs font-medium text-text-muted truncate">{description}</span>
          )}
        </div>
      </div>
      <div className="shrink-0 ml-4">
        {action}
      </div>
    </>
  );

  const containerClasses = `group flex items-center justify-between p-4 transition-colors ${
    borderBottom ? "border-b border-gray-100 dark:border-gray-800/50" : ""
  } ${onClick ? "cursor-pointer hover:bg-bg-secondary/50 active:bg-bg-secondary" : ""}`;

  if (onClick) {
    return (
      <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={onClick} className={containerClasses + " w-full text-left"}>
        {content}
      </motion.button>
    );
  }

  return (
    <div className={containerClasses}>
      {content}
    </div>
  );
}
