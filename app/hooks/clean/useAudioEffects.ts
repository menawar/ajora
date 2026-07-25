import { useState } from 'react';

export function useAudioEffects() {
  const [data, setData] = useState(null);
  return { data };
}
