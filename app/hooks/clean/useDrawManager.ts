import { useState } from 'react';

export function useDrawManager() {
  const [data, setData] = useState(null);
  return { data };
}
