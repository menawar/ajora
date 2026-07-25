import { useState } from 'react';

export function useVaultDetails() {
  const [data, setData] = useState(null);
  return { data };
}
