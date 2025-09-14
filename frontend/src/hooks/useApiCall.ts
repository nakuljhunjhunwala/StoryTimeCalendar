import { useState, useCallback, useRef } from 'react';

interface UseApiCallOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  debounceMs?: number;
}

interface UseApiCallReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  call: (...args: any[]) => Promise<void>;
  reset: () => void;
}

export function useApiCall<T = any>(
  apiFunction: (...args: any[]) => Promise<any>,
  options: UseApiCallOptions = {}
): UseApiCallReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const call = useCallback(
    async (...args: unknown[]) => {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      // Clear any existing debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      const executeCall = async () => {
        setLoading(true);
        setError(null);

        try {
          const result = await apiFunction(...args);

          // Check if request was aborted
          if (abortControllerRef.current?.signal.aborted) {
            return;
          }

          setData(result);
          options.onSuccess?.(result);
        } catch (err: any) {
          // Check if request was aborted
          if (abortControllerRef.current?.signal.aborted) {
            return;
          }

          const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
          setError(errorMessage);
          options.onError?.(err);
        } finally {
          // Check if request was aborted
          if (!abortControllerRef.current?.signal.aborted) {
            setLoading(false);
          }
        }
      };

      if (options.debounceMs) {
        debounceRef.current = setTimeout(executeCall, options.debounceMs);
      } else {
        await executeCall();
      }
    },
    [apiFunction, options]
  );

  const reset = useCallback(() => {
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return { data, loading, error, call, reset };
}
