interface ProgressBarProps {
  title?: string;
}

export function ProgressBar({ title = "ProgressBar" }: ProgressBarProps) {
  return <div className="p-4 flex items-center justify-center">{title}</div>;
}
