interface GlassCardProps {
  title?: string;
}

export function GlassCard({ title = "GlassCard" }: GlassCardProps) {
  return <div className="p-4 flex items-center justify-center">{title}</div>;
}
