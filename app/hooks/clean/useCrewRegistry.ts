import { useState } from 'react';

export function useCrewRegistry() {
  const [data, setData] = useState(null);
  return { data };
}
