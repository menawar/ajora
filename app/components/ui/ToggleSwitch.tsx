interface ToggleSwitchProps {
  title?: string;
}

export function ToggleSwitch({ title = "ToggleSwitch" }: ToggleSwitchProps) {
  return <div className="p-4 flex items-center justify-center">{title}</div>;
}
