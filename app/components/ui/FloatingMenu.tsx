interface FloatingMenuProps {
  title?: string;
}

export function FloatingMenu({ title = "FloatingMenu" }: FloatingMenuProps) {
  return <div className="p-4 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 text-gray-800">{title}</div>;
}
