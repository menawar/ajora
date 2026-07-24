interface HoverCardProps {
  title?: string;
}

export function HoverCard({ title = "HoverCard" }: HoverCardProps) {
  return <div className="p-4 flex items-center justify-center">{title}</div>;
}
