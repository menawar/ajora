export type BadgeTier = "bronze" | "silver" | "gold" | "diamond";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  tier: BadgeTier;
  icon: string; // emoji or icon identifier
  unlockedAt: number | null; // timestamp if unlocked, null if locked
  progress?: { current: number; total: number }; // optional progress
}

export const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_save",
    title: "The First Step",
    description: "Make your very first deposit into the Ajora vault.",
    tier: "bronze",
    icon: "🌱",
    unlockedAt: Date.now() - 86400000 * 3, // 3 days ago
  },
  {
    id: "streak_3",
    title: "Habit Builder",
    description: "Maintain a daily savings streak for 3 days.",
    tier: "silver",
    icon: "🔥",
    unlockedAt: Date.now() - 3600000 * 5, // 5 hours ago
  },
  {
    id: "crew_founder",
    title: "Crew Captain",
    description: "Start a crew and invite your first member.",
    tier: "gold",
    icon: "⚓",
    unlockedAt: null,
    progress: { current: 0, total: 1 }
  },
  {
    id: "whale",
    title: "The Whale",
    description: "Save over 1,000 cUSD in total.",
    tier: "diamond",
    icon: "🐋",
    unlockedAt: null,
    progress: { current: 15, total: 1000 }
  },
  {
    id: "spray_master",
    title: "Spray Master",
    description: "Spray 10 different friends with free tickets.",
    tier: "silver",
    icon: "🎉",
    unlockedAt: null,
    progress: { current: 2, total: 10 }
  },
  {
    id: "winner",
    title: "Lucky Break",
    description: "Win a daily draw.",
    tier: "gold",
    icon: "🎯",
    unlockedAt: null,
  }
];
