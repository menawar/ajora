import { useState, useCallback } from 'react';

export function useTokenPriceFeed<T = any>(initial: T | null = null) {
  const [data, setData] = useState<T | null>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const execute = useCallback(async (action: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    try { const res = await action(); setData(res); return res; }
    catch (err) { const e = err instanceof Error ? err : new Error(String(err)); setError(e); throw e; }
    finally { setLoading(false); }
  }, []);
  const reset = useCallback(() => { setData(initial); setError(null); setLoading(false); }, [initial]);
  return { data, setData, loading, error, execute, reset };
}
