import { useState } from 'react';

export function useLocalStorageCache() {
  const [data, setData] = useState(null);
  return { data };
}
