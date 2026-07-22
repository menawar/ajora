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

