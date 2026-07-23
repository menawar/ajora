"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";

interface CarouselProps {
  children: ReactNode[];
  onComplete?: () => void;
  onSkip?: () => void;
  className?: string;
}

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.9,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.9,
  }),
};

/** Swipeable carousel with dot indicators, primarily used for Onboarding. */
export function Carousel({ children, onComplete, onSkip, className = "" }: CarouselProps) {
  const [[page, direction], setPage] = useState([0, 0]);
  const slideCount = children.length;

  const paginate = (newDirection: number) => {
    const next = page + newDirection;
    if (next < 0) return;
    if (next >= slideCount) {
      onComplete?.();
      return;
    }
    setPage([next, newDirection]);
  };

  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, { offset, velocity }: PanInfo) => {
    const swipe = Math.abs(offset.x) * velocity.x;
    if (swipe < -10000 || offset.x < -100) {
      paginate(1);
    } else if (swipe > 10000 || offset.x > 100) {
      paginate(-1);
    }
  };

  return (
    <div className={`relative flex flex-col items-center overflow-hidden ${className}`}>
      {/* Viewport */}
      <div className="relative w-full h-full flex justify-center items-center">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={page}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={handleDragEnd}
            className="w-full absolute cursor-grab active:cursor-grabbing"
          >
            {children[page]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation & Indicators */}
      <div className="mt-6 flex items-center justify-between w-full px-4">
        {onSkip && (
          <button
            onClick={onSkip}
            className="text-xs font-bold text-text-muted hover:text-text-primary transition-colors py-2 px-3 rounded-lg"
          >
            Skip
          </button>
        )}
        
        {/* Dots */}
        <div className="flex gap-2 mx-auto">
          {children.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (i !== page) setPage([i, i > page ? 1 : -1]);
              }}
              className={`h-2 transition-all rounded-full ${
                i === page
                  ? "w-6 bg-celo-green"
                  : "w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => paginate(1)}
          className="text-xs font-bold text-celo-green hover:text-[#2ebf73] transition-colors py-2 px-3 rounded-lg bg-celo-green/10 active:scale-95"
        >
          {page === slideCount - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}
