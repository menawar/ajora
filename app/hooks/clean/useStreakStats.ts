import { useState } from 'react';

export function useStreakStats() {
  const [data, setData] = useState(null);
  return { data };
}
