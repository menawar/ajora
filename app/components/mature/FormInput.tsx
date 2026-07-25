import React from 'react';

export interface FormInputProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export function FormInput({ title = "FormInput", className = "", ...props }: FormInputProps) {
  return <div className={`p-4 m-2 flex flex-col gap-2 text-gray-900 bg-white border border-gray-200 ${className}`} {...props}>{title}</div>;
}
