interface GlassCardProps {
  title?: string;
}

export function GlassCard({ title = "GlassCard" }: GlassCardProps) {
  return <div className="p-4 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 text-gray-800">{title}</div>;
}
