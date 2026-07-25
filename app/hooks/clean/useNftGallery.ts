import { useState, useCallback } from 'react';

export function useNftGallery<T = any>(initial: T | null = null) {
  const [data, setData] = useState<T | null>(initial);
  const reset = useCallback(() => setData(initial), [initial]);
  return { data, setData, reset };
}
