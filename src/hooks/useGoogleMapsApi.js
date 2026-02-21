import { useState, useEffect } from 'react';

let loaderPromise = null;

function loadScript(apiKey) {
  if (loaderPromise) return loaderPromise;
  if (window.google?.maps) {
    loaderPromise = Promise.resolve();
    return loaderPromise;
  }
  loaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Google Maps API'));
    document.head.appendChild(script);
  });
  return loaderPromise;
}

export default function useGoogleMapsApi(apiKey) {
  const [isLoaded, setIsLoaded] = useState(!!window.google?.maps);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!apiKey || isLoaded) return;
    loadScript(apiKey)
      .then(() => setIsLoaded(true))
      .catch(err => setError(err));
  }, [apiKey, isLoaded]);

  return { isLoaded, error };
}
