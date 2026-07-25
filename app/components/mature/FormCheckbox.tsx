import React, { useState } from 'react';

/**
 * FormCheckbox Props
 */
export interface FormCheckboxProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The title to display */
  title?: string;
}

/**
 * A mature, accessible FormCheckbox component designed for enterprise interfaces.
 * Focuses on clean typography and subtle interactive states.
 */
export function FormCheckbox({ title = "FormCheckbox", className = "", ...props }: FormCheckboxProps) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`p-4 m-2 flex flex-col gap-2 text-sm font-medium transition-colors duration-150 ease-in-out ${isHovered ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-200'} text-gray-900 border rounded-md shadow-sm ${className}`} 
      {...props}
    >
      {title}
    </div>
  );
}
