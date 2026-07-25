import { useState } from 'react';

export function usePaginationState() {
  const [data, setData] = useState(null);
  return { data };
}
