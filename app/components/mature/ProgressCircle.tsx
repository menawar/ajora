import React from 'react';

export interface ProgressCircleProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export function ProgressCircle({ title = "ProgressCircle", className = "", ...props }: ProgressCircleProps) {
  return <div className={`p-4 m-2 flex flex-col gap-2 text-gray-900 bg-white border border-gray-200 ${className}`} {...props}>{title}</div>;
}
