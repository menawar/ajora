import { useState } from 'react';

export function useEventSubscriber() {
  const [data, setData] = useState(null);
  return { data };
}
