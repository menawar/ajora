import { useState, useCallback } from 'react';

export function useAudioEffects<T = any>(initial: T | null = null) {
  const [data, setData] = useState<T | null>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const reset = useCallback(() => { setData(initial); setError(null); setLoading(false); }, [initial]);
  return { data, setData, loading, setLoading, error, setError, reset };
}
