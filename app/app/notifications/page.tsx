"use client";

import { motion, type Variants } from "framer-motion";
import { ArrowLeft, BellRing, UserPlus, Gift, Trophy, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Ripple } from "../../components/ui/Ripple";

type NotificationType = "crew" | "draw" | "achievement" | "system";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "draw",
    title: "Draw Results Are Out!",
    message: "Check if you won the 5,000 cUSD grand prize for Period #124.",
    time: "2 hours ago",
    read: false,
  },
  {
    id: "2",
    type: "crew",
    title: "Amara joined your crew",
    message: "Your crew size increased. The daily multiplier is now active!",
    time: "5 hours ago",
    read: false,
  },
  {
    id: "3",
    type: "achievement",
    title: "Badge Unlocked: Early Bird",
    message: "You saved in the first hour of a new period.",
    time: "1 day ago",
    read: true,
  },
  {
    id: "4",
    type: "system",
    title: "Welcome to Ajora",
    message: "Your first deposit is safely earning yield.",
    time: "3 days ago",
    read: true,
  }
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "draw": return <Gift className="w-5 h-5 text-celo-gold" />;
      case "crew": return <UserPlus className="w-5 h-5 text-celo-green" />;
      case "achievement": return <Trophy className="w-5 h-5 text-amber-500" />;
      case "system": return <BellRing className="w-5 h-5 text-blue-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <motion.main
      className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 p-6 pb-24 bg-bg-primary"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.header variants={itemVariants} className="pt-4 flex items-center justify-between">
        <div>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-gradient flex items-center gap-3">
            Activity 
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-sm font-bold px-2 py-0.5 rounded-full shadow-sm">
                {unreadCount}
              </span>
            )}
          </h1>
        </div>
        
        {unreadCount > 0 && (
          <button 
            onClick={markAllRead}
            className="text-sm font-bold text-celo-green bg-celo-green/10 px-3 py-1.5 rounded-full hover:bg-celo-green/20 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4 inline mr-1" />
            Mark all read
          </button>
        )}
      </motion.header>

      <motion.section variants={itemVariants} className="flex flex-col gap-3 mt-2">
        {notifications.length === 0 ? (
          <div className="glass-panel rounded-3xl py-12 text-center">
            <BellRing className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-text-primary">All caught up!</p>
            <p className="text-xs text-text-secondary mt-1">No new notifications.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <Ripple key={notif.id} className="w-full rounded-2xl">
              <div 
                className={`flex gap-4 p-4 rounded-2xl border transition-colors cursor-pointer ${
                  notif.read 
                    ? "bg-transparent border-transparent hover:bg-bg-secondary" 
                    : "glass-panel border-celo-green/20 shadow-sm"
                }`}
                onClick={() => {
                  setNotifications(prev => 
                    prev.map(n => n.id === notif.id ? { ...n, read: true } : n)
                  );
                }}
              >
                <div className={`mt-0.5 shrink-0 w-10 h-10 flex items-center justify-center rounded-full ${
                  notif.read ? "bg-bg-secondary" : "bg-white dark:bg-gray-800 shadow-sm"
                }`}>
                  {getIcon(notif.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className={`font-bold text-sm truncate ${notif.read ? "text-text-primary" : "text-text-primary"}`}>
                      {notif.title}
                    </h3>
                    <span className="text-[10px] font-semibold text-text-muted shrink-0 whitespace-nowrap mt-0.5">
                      {notif.time}
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed ${notif.read ? "text-text-muted" : "text-text-secondary font-medium"}`}>
                    {notif.message}
                  </p>
                </div>
                
                {!notif.read && (
                  <div className="shrink-0 w-2 h-2 rounded-full bg-red-500 mt-1.5 shadow-sm shadow-red-500/50" />
                )}
              </div>
            </Ripple>
          ))
        )}
      </motion.section>
    </motion.main>
  );
}
