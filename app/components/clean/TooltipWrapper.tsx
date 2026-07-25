import React from 'react';

export interface TooltipWrapperProps {
  title?: string;
  className?: string;
}

export function TooltipWrapper({ title = "TooltipWrapper", className = "" }: TooltipWrapperProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
