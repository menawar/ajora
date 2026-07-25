import { useState } from 'react';

export function useThemeSwitcher() {
  const [data, setData] = useState(null);
  return { data };
}
