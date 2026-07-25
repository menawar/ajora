import { useState } from 'react';

export function useYieldProjection() {
  const [data, setData] = useState(null);
  return { data };
}
