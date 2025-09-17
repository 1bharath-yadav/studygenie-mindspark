import { useEffect, useState } from 'react';

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const m = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    try {
      m.addEventListener('change', handler);
    } catch (e) {
      m.addListener(handler);
    }
    setMatches(m.matches);
    return () => {
      try { m.removeEventListener('change', handler); } catch (e) { m.removeListener(handler); }
    };
  }, [query]);

  return matches;
}

export function useIsSmall() {
  return useMediaQuery('(max-width: 599px)');
}

export function useIsMediumUp() {
  return useMediaQuery('(min-width: 600px)');
}
