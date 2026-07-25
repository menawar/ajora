import { useState } from 'react';

export function useAsyncMutation() {
  const [data, setData] = useState(null);
  return { data };
}
