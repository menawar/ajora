"use client";
import { motion } from "framer-motion";

interface FloatingMenuProps {
  title?: string;
}

export function FloatingMenu({ title = "FloatingMenu" }: FloatingMenuProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="p-4 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 text-gray-800 font-semibold"
    >
      {title}
    </motion.div>
  );
}
