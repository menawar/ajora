import React from 'react';

export interface FormLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export function FormLabel({ title = "FormLabel", className = "", ...props }: FormLabelProps) {
  return <div className={`p-4 m-2 flex flex-col gap-2 text-gray-900 bg-white border border-gray-200 ${className}`} {...props}>{title}</div>;
}
