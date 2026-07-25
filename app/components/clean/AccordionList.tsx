import React from 'react';

export interface AccordionListProps {
  title?: string;
  className?: string;
}

export function AccordionList({ title = "AccordionList", className = "" }: AccordionListProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
