/**
 * Base API client hook that provides centralized HTTP functionality
 * Now uses Next.js API routes as proxy for server-to-server communication
 */

import { useMemo } from 'react';
import { AxiosRequestConfig } from 'axios';
import { proxyClient } from '@/lib/proxy-client';

export interface ApiClientOptions {
  baseUrl?: string;
  timeout?: number;
}

export function useApiClient(options?: ApiClientOptions) {
  return useMemo(() => {
    return {
      async get<T = any>(url: string, config?: Record<string, string>): Promise<T> {
        return proxyClient.get<T>(url, config);
      },

      async post<T = any>(url: string, data?: any, config?: Record<string, string>): Promise<T> {
        return proxyClient.post<T>(url, data, config);
      },

      async put<T = any>(url: string, data?: any, config?: Record<string, string>): Promise<T> {
        return proxyClient.put<T>(url, data, config);
      },

      async patch<T = any>(url: string, data?: any, config?: Record<string, string>): Promise<T> {
        return proxyClient.patch<T>(url, data, config);
      },

      async delete<T = any>(url: string, config?: Record<string, string>): Promise<T> {
        return proxyClient.delete<T>(url, config);
      },
    };
  }, [options]);
}
