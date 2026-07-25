import { useState } from 'react';

export function useToastNotifications() {
  const [data, setData] = useState(null);
  return { data };
}
