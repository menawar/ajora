export interface Quest {
  id: string;
  title: string;
  description: string;
  reward: number; // e.g. mock points or tickets
  type: "daily" | "weekly" | "one-time";
  progress: {
    current: number;
    target: number;
  };
  claimed: boolean;
}

export const MOCK_QUESTS: Quest[] = [
  {
    id: "q1",
    title: "Daily Saver",
    description: "Save at least 1 cUSD into the vault today.",
    reward: 50,
    type: "daily",
    progress: { current: 1, target: 1 },
    claimed: false,
  },
  {
    id: "q2",
    title: "Social Butterfly",
    description: "Share your Ajora referral link on X (Twitter).",
    reward: 100,
    type: "daily",
    progress: { current: 0, target: 1 },
    claimed: false,
  },
  {
    id: "q3",
    title: "Consistent Builder",
    description: "Maintain a 3-day savings streak.",
    reward: 500,
    type: "weekly",
    progress: { current: 2, target: 3 },
    claimed: false,
  },
  {
    id: "q4",
    title: "Crew expansion",
    description: "Spray 5 friends with free tickets.",
    reward: 250,
    type: "weekly",
    progress: { current: 5, target: 5 },
    claimed: true,
  },
];
