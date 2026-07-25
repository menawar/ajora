import React from 'react';

export interface AccordionListProps {
  title?: string;
}

export function AccordionList({ title }: AccordionListProps) {
  return <div>{title}</div>;
}
