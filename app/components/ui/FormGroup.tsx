import { ReactNode } from "react";

export function FormGroup({ children, className = "" }: { children: ReactNode, className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {children}
    </div>
  );
}
