import { useState } from 'react';

export function usePotVaultDetails() {
  const [data, setData] = useState(null);
  return { data };
}
