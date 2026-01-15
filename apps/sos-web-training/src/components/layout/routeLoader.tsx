'use client';

import { usePathname } from 'next/navigation';
import { AppProgressBar } from 'next-nprogress-bar';
import { useState, useEffect } from 'react';

const RouteLoader = () => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only render on client side to prevent SSR issues
  if (!mounted) {
    return null;
  }

  return (
    <AppProgressBar
      key={pathname}
      height="4px"
      color="#4d77b3"
      options={{
        showSpinner: true,
        speed: 200,
        trickleSpeed: 200,
      }}
    />
  );
};

export default RouteLoader;
