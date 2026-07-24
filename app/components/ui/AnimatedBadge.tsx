interface AnimatedBadgeProps {
  title?: string;
}

export function AnimatedBadge({ title = "AnimatedBadge" }: AnimatedBadgeProps) {
  return <div className="p-4 flex items-center justify-center">{title}</div>;
}
