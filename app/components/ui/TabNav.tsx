interface TabNavProps {
  title?: string;
}

export function TabNav({ title = "TabNav" }: TabNavProps) {
  return <div className="p-4 flex items-center justify-center">{title}</div>;
}
