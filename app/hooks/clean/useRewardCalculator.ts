import { useState } from 'react';

export function useRewardCalculator() {
  const [data, setData] = useState(null);
  return { data };
}
