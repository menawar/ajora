import React from 'react';

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export function Divider({ title = "Divider", className = "", ...props }: DividerProps) {
  return <div className={`p-4 m-2 flex flex-col gap-2 text-gray-900 bg-white border border-gray-200 ${className}`} {...props}>{title}</div>;
}
