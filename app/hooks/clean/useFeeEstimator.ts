import { useState } from 'react';

export function useFeeEstimator() {
  const [data, setData] = useState(null);
  return { data };
}
