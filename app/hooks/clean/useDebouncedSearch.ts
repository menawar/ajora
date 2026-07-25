import { useState } from 'react';

export function useDebouncedSearch() {
  const [data, setData] = useState(null);
  return { data };
}
