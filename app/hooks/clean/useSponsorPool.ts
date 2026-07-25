import { useState } from 'react';

export function useSponsorPool() {
  const [data, setData] = useState(null);
  return { data };
}
