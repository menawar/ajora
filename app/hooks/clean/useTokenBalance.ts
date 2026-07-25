import { useState } from 'react';

export function useTokenBalance() {
  const [data, setData] = useState(null);
  return { data };
}
