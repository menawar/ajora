import { useState } from 'react';

export function useCeloGasPrice() {
  const [data, setData] = useState(null);
  return { data };
}
