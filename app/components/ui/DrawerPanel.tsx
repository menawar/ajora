interface DrawerPanelProps {
  title?: string;
}

export function DrawerPanel({ title = "DrawerPanel" }: DrawerPanelProps) {
  return <div className="p-4 flex items-center justify-center">{title}</div>;
}
