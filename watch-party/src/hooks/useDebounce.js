import { useState, useEffect } from "react";

// This custom hook takes a value (like a search term) and a delay.
// It returns a new "debounced" value that only updates after the specified delay.
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up a timer that will update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // This is the cleanup function: if the user types again before the delay is over,
    // this will clear the previous timer and start a new one.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Only re-run the effect if the value or delay changes

  return debouncedValue;
}
