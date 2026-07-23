"use client";

import { useState, useEffect } from "react";

// Replacer for BigInt
function replacer(_key: string, value: unknown) {
  if (typeof value === "bigint") return { _isBigInt: true, value: value.toString() };
  return value;
}

// Reviver for BigInt
function reviver(_key: string, value: unknown) {
  if (value && typeof value === "object" && "_isBigInt" in value) {
    return BigInt((value as { value: string }).value);
  }
  return value;
}

/**
 * A useState wrapper that caches to localStorage for offline tolerance.
 */
export function useCachedState<T>(key: string, initialValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item, reviver) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(key, JSON.stringify(state, replacer));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    }
  }, [key, state]);

  return [state, setState];
}
