interface TooltipWrapperProps {
  title?: string;
}

export function TooltipWrapper({ title = "TooltipWrapper" }: TooltipWrapperProps) {
  return <div className="p-4 flex items-center justify-center">{title}</div>;
}
