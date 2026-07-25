import { useState } from 'react';

export function useLeaderboard() {
  const [data, setData] = useState(null);
  return { data };
}
