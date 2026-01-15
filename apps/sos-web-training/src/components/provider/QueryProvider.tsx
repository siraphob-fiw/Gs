'use client';

import React, { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/react-query-client';

interface QueryProviderProps {
  children: ReactNode;
}

export const QueryProvider = ({ children }: QueryProviderProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <>
        {children}
        {process.env.NODE_ENV === 'development' && (
          <React.Suspense fallback={null}>{/* <DevTools /> */}</React.Suspense>
        )}
      </>
    </QueryClientProvider>
  );
};

// Lazy load devtools only in development
// const DevTools = React.lazy(() =>
//   import('@tanstack/react-query-devtools')
//     .then(module => ({
//       default: () => <module.ReactQueryDevtools initialIsOpen={false} />
//     }))
//     .catch(() => ({
//       default: () => <></>
//     }))
// );
