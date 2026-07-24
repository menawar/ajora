interface HeroSectionProps {
  title?: string;
}

export function HeroSection({ title = "HeroSection" }: HeroSectionProps) {
  return <div className="p-4 flex items-center justify-center">{title}</div>;
}
