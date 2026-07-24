interface FloatingMenuProps {
  title?: string;
}

export function FloatingMenu({ title = "FloatingMenu" }: FloatingMenuProps) {
  return <div className="p-4 flex items-center justify-center">{title}</div>;
}
