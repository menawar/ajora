"use client";

import { useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { PartyPopper, TrendingUp, Users, ChevronRight } from "lucide-react";
import { useOnboarding } from "../../hooks/useOnboarding";
import { useTranslation } from "../../lib/i18n";
import { Ripple } from "./Ripple";
import { useSFX } from "../../hooks/useSFX";

const SLIDES = [
  {
    id: "welcome",
    icon: <PartyPopper className="w-16 h-16 text-celo-green" />,
    titleKey: "onboarding.step1.title",
    descKey: "onboarding.step1.desc",
  },
  {
    id: "grow",
    icon: <TrendingUp className="w-16 h-16 text-celo-gold" />,
    titleKey: "onboarding.step2.title",
    descKey: "onboarding.step2.desc",
  },
  {
    id: "crew",
    icon: <Users className="w-16 h-16 text-[#35d07f]" />,
    titleKey: "onboarding.step3.title",
    descKey: "onboarding.step3.desc",
  }
] as const;

export function OnboardingModal() {
  const { hasSeenOnboarding, isLoaded, completeOnboarding } = useOnboarding();
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const sfx = useSFX();

  if (!isLoaded || hasSeenOnboarding) return null;

  const nextSlide = () => {
    sfx.pop();
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(curr => curr + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, { offset, velocity }: PanInfo) => {
    const swipe = Math.abs(offset.x) * velocity.x;
    if (swipe < -1000) {
      nextSlide();
    } else if (swipe > 1000 && currentIndex > 0) {
      sfx.pop();
      setCurrentIndex(curr => curr - 1);
    }
  };

  return (
    <AnimatePresence>
      {!hasSeenOnboarding && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/95 backdrop-blur-md p-6"
        >
          <div className="w-full max-w-sm flex flex-col h-[70vh] max-h-[600px]">
            {/* Header / Skip */}
            <div className="flex justify-end pt-4">
              <button 
                onClick={() => { sfx.click(); completeOnboarding(); }}
                className="text-sm font-bold text-text-muted hover:text-text-primary transition-colors"
              >
                {t("onboarding.skip")}
              </button>
            </div>

            {/* Slides Carousel */}
            <div className="flex-1 relative mt-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 50, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -50, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={1}
                  onDragEnd={handleDragEnd}
                  className="absolute inset-0 flex flex-col items-center text-center touch-none"
                >
                  <div className="p-6 rounded-full bg-bg-secondary/50 shadow-inner mb-8">
                    {SLIDES[currentIndex].icon}
                  </div>
                  <h2 className="text-2xl font-black text-text-primary mb-4 tracking-tight">
                    {t(SLIDES[currentIndex].titleKey)}
                  </h2>
                  <p className="text-base text-text-secondary font-medium leading-relaxed px-2">
                    {t(SLIDES[currentIndex].descKey)}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer / Controls */}
            <div className="pb-8">
              {/* Dot Indicators */}
              <div className="flex justify-center gap-3 mb-8">
                {SLIDES.map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      width: i === currentIndex ? 24 : 8,
                      backgroundColor: i === currentIndex ? "#35d07f" : "var(--color-bg-secondary)"
                    }}
                    className="h-2 rounded-full shadow-sm"
                  />
                ))}
              </div>

              {/* Action Button */}
              <Ripple className="w-full rounded-2xl">
                <button
                  onClick={nextSlide}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-celo-green px-6 py-4 font-bold text-white shadow-[0_4px_14px_0_rgba(53,208,127,0.39)] transition-all hover:shadow-[0_6px_20px_rgba(53,208,127,0.23)] hover:bg-[#2ebf73] active:scale-95"
                >
                  {currentIndex === SLIDES.length - 1 ? (
                    t("onboarding.finish")
                  ) : (
                    <>{t("onboarding.next")} <ChevronRight className="w-5 h-5" /></>
                  )}
                </button>
              </Ripple>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
