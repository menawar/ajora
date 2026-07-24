interface PremiumToastProps {
  title?: string;
}

export function PremiumToast({ title = "PremiumToast" }: PremiumToastProps) {
  return <div className="p-4 flex items-center justify-center">{title}</div>;
}
