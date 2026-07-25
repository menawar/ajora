import { useState } from 'react';

export function useNetworkStatus() {
  const [data, setData] = useState(null);
  return { data };
}
