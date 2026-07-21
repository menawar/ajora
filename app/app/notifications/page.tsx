"use client";

import { motion, type Variants } from "framer-motion";
import { ArrowLeft, BellRing, UserPlus, Gift, Trophy, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Ripple } from "../../components/ui/Ripple";
import { useTranslation } from "../../lib/i18n";
import { useWallet } from "../../hooks/useWallet";

type NotificationType = "crew" | "draw" | "achievement" | "system";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

// Mock structure is now defined by the Notification interface and API response

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { address } = useWallet();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!address) {
      setLoading(false);
      return;
    }
    const fetchNotifs = async () => {
      try {
        const res = await fetch(`/api/notifications?address=${address}`);
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        if (active && Array.isArray(json)) setNotifications(json);
      } catch (e) {
        console.error("API failed", e);
        if (active) setNotifications([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchNotifs();
    return () => { active = false; };
  }, [address]);

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (address) {
      try {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, notificationIds: [] })
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const markSingleRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (address) {
      try {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, notificationIds: [id] })
        });
      } catch (e) {
        console.error(e);
      }
    }
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
            {t("nav.home")}
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-gradient flex items-center gap-3">
            {t("notifications.title")}
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
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-celo-green border-t-transparent rounded-full animate-spin" /></div>
        ) : notifications.length === 0 ? (
          <div className="glass-panel rounded-3xl py-12 text-center">
            <BellRing className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-text-primary">{t("notifications.empty")}</p>
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
                  if (!notif.read) markSingleRead(notif.id);
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
