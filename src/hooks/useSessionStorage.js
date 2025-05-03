import { useState, useEffect } from "react";

/**
 * Custom hook for handling session storage
 * @param {string} key - The key to store in session storage
 * @param {any} initialValue - The initial value
 * @returns {Array} - [value, setValue] - State and setter function
 */
const useSessionStorage = (key, initialValue) => {
  // Get from session storage then parse or return initialValue
  const readStorage = () => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  };

  // State to store our value
  const [storedValue, setStoredValue] = useState(readStorage);

  // Return a wrapped version of useState's setter function that
  // persists the new value to sessionStorage
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      // Save state
      setStoredValue(valueToStore);

      // Save to sessionStorage
      if (valueToStore === null || valueToStore === undefined) {
        window.sessionStorage.removeItem(key);
      } else {
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting sessionStorage key "${key}":`, error);
    }
  };

  // Listen for changes to the key in storage events (from other tabs/windows)
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === key && event.storageArea === window.sessionStorage) {
        try {
          setStoredValue(
            event.newValue ? JSON.parse(event.newValue) : initialValue
          );
        } catch (error) {
          console.error(
            `Error handling storage event for key "${key}":`,
            error
          );
        }
      }
    };

    // Listen for storage events
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue];
};

export default useSessionStorage;
