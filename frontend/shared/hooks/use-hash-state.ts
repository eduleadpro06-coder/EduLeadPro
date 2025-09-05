import { useState, useEffect } from 'react';

export function useHashState(defaultValue: string) {
  const [hash, setHash] = useState(() => {
    // Initialize from URL hash if available, otherwise use default value
    return window.location.hash.slice(1) || defaultValue;
  });

  useEffect(() => {
    // Update URL hash when state changes
    if (hash) {
      window.location.hash = hash;
    } else {
      // Remove hash from URL if state is empty
      window.history.pushState('', document.title, window.location.pathname + window.location.search);
    }
  }, [hash]);

  return [hash, setHash] as const;
} 