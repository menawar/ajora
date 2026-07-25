import { useState } from 'react';

export function useMediaQueryBreakpoints() {
  const [data, setData] = useState(null);
  return { data };
}
