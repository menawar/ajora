import { useState } from 'react';

export function useWalletAuth() {
  const [data, setData] = useState(null);
  return { data };
}
