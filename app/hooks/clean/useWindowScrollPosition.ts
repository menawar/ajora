import { useState } from 'react';

export function useWindowScrollPosition() {
  const [data, setData] = useState(null);
  return { data };
}
