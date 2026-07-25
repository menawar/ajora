import { useState } from 'react';

export function useMiniPayContext() {
  const [data, setData] = useState(null);
  return { data };
}
