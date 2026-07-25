import { useState } from 'react';

export function useIntervalTimer() {
  const [data, setData] = useState(null);
  return { data };
}
