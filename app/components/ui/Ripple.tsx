"use client";

import { useCallback, useRef } from "react";
import { useSFX } from "../../hooks/useSFX";

interface RippleOptions {
  color?: string;
  duration?: number;
}

/**
 * Returns a click handler that injects a Material-style ripple effect
 * into the target element. Usage: `<button {...getRippleProps()}>…</button>`
 */
function useRipple(options: RippleOptions = {}) {
  const { color = "rgba(255,255,255,0.35)", duration = 500 } = options;
  const sfx = useSFX();

  const createRipple = useCallback(
    (e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => {
      // For keyboard events, only trigger on Enter or Space
      if (e.type === "keydown") {
        const key = (e as React.KeyboardEvent).key;
        if (key !== "Enter" && key !== " ") return;
      }

      sfx.click();
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      
      // Center the ripple for keyboard events, otherwise use mouse position
      const x = e.type === "keydown" 
        ? rect.width / 2 - size / 2 
        : (e as React.MouseEvent).clientX - rect.left - size / 2;
      const y = e.type === "keydown" 
        ? rect.height / 2 - size / 2 
        : (e as React.MouseEvent).clientY - rect.top - size / 2;

      const ripple = document.createElement("span");
      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
        width: ${size}px;
        height: ${size}px;
        top: ${y}px;
        left: ${x}px;
        background: ${color};
        transform: scale(0);
        animation: ajora-ripple ${duration}ms ease-out forwards;
      `;

      // Inject keyframes once
      if (!document.getElementById("ajora-ripple-style")) {
        const style = document.createElement("style");
        style.id = "ajora-ripple-style";
        style.textContent = `
          @keyframes ajora-ripple {
            to { transform: scale(1); opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }

      // Parent must be position: relative + overflow: hidden
      const prevPosition = el.style.position;
      const prevOverflow = el.style.overflow;
      el.style.position = "relative";
      el.style.overflow = "hidden";

      el.appendChild(ripple);
      const cleanup = () => {
        ripple.remove();
        el.style.position = prevPosition;
        el.style.overflow = prevOverflow;
      };
      setTimeout(cleanup, duration + 100);
    },
    [color, duration, sfx],
  );

  return { onMouseDown: createRipple, onKeyDown: createRipple };
}

/** Convenience wrapper component that applies a ripple to its children */
export function Ripple({
  children,
  className = "",
  color,
  duration,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
  duration?: number;
  as?: React.ElementType;
}) {
  const rippleProps = useRipple({ color, duration });
  return (
    <Tag 
      className={`relative overflow-hidden ${className}`} 
      {...rippleProps}
      {...(Tag === "div" ? { tabIndex: 0, role: "button" } : {})}
    >
      {children}
    </Tag>
  );
}
