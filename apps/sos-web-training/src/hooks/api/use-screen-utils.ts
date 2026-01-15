import { useState, useEffect } from 'react';

/**
 * Hook for detecting if the current viewport is mobile-sized
 * Uses 768px as the breakpoint (matches Tailwind's md breakpoint)
 *
 * @param breakpoint - Optional custom breakpoint in pixels (default: 768)
 * @returns boolean indicating if the viewport is mobile-sized
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < breakpoint;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    window.addEventListener('resize', handleResize);

    // Ensure state is synced in case of hydration mismatch
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [breakpoint]);

  return isMobile;
}

export function useIsTablet(min: number = 768, max: number = 1024): boolean {
  const [isTablet, setIsTablet] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= min && window.innerWidth < max;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsTablet(window.innerWidth >= min && window.innerWidth < max);
    };

    window.addEventListener('resize', handleResize);

    // Ensure state is synced in case of hydration mismatch
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [min, max]);

  return isTablet;
}

export function useIsDesktop(breakpoint: number = 1280): boolean {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= breakpoint;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsDesktop(window.innerWidth >= breakpoint);
    };

    window.addEventListener('resize', handleResize);

    // Ensure state is synced in case of hydration mismatch
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [breakpoint]);

  return isDesktop;
}

export function useScrollPosition() {
  const [scrollPosition, setScrollPosition] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
  }, []);
  return scrollPosition;
}
