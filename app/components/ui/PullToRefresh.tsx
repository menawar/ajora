"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { motion, useAnimation, PanInfo } from "framer-motion";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  pullThreshold?: number;
}

export function PullToRefresh({ onRefresh, children, pullThreshold = 80 }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [canPull, setCanPull] = useState(true);

  // Only allow pull-to-refresh when scrolled to the very top
  useEffect(() => {
    const checkScroll = () => {
      if (containerRef.current) {
        setCanPull(containerRef.current.scrollTop <= 0);
      }
    };
    const el = containerRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      return () => el.removeEventListener("scroll", checkScroll);
    }
  }, []);

  const handleDragEnd = async (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!canPull) return;
    
    if (info.offset.y >= pullThreshold) {
      setIsRefreshing(true);
      await controls.start({ y: pullThreshold / 2, transition: { type: "spring", stiffness: 300, damping: 30 } });
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        controls.start({ y: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
      }
    } else {
      controls.start({ y: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute top-0 left-0 w-full flex justify-center pt-4 pointer-events-none z-0">
        <motion.div
          animate={{ rotate: isRefreshing ? 360 : 0 }}
          transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
          className={`bg-bg-secondary border border-gray-200 dark:border-gray-800 rounded-full p-2 shadow-sm ${
            isRefreshing ? "opacity-100" : "opacity-0"
          }`}
        >
          <RefreshCw className="w-5 h-5 text-celo-green" />
        </motion.div>
      </div>

      <motion.div
        ref={containerRef}
        drag={canPull ? "y" : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={canPull ? { top: 0, bottom: 0.5 } : 0}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="w-full h-full overflow-y-auto no-scrollbar relative z-10 overscroll-none"
      >
        {children}
      </motion.div>
    </div>
  );
}
