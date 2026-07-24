interface AccordionListProps {
  title?: string;
}

export function AccordionList({ title = "AccordionList" }: AccordionListProps) {
  return <div className="p-4 flex items-center justify-center">{title}</div>;
}
