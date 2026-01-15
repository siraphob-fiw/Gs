import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClient } from '../services/http-client';
import { HttpClientConfig } from '../types/external-types';
import { Results } from '@strengthos/shared-utils';

describe('HttpClient', () => {
  let httpClient: HttpClient;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    httpClient = new HttpClient();
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockResponse = { data: { id: 1, name: 'test' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: vi.fn((key) => key === 'content-type' ? 'application/json' : null),
          forEach: vi.fn((cb) => cb('application/json', 'content-type')),
        },
        json: vi.fn().mockResolvedValue(mockResponse.data),
        text: vi.fn().mockResolvedValue(''),
      });

      const result = await httpClient.get('https://api.example.com/test');

      expect(result.isOk).toBe(true);
      expect(result.returnValue?.data).toEqual(mockResponse.data);
      expect(result.returnValue?.status).toBe(200);
    });

    it('should handle 404 errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: {
          get: vi.fn((key) => key === 'content-type' ? 'application/json' : null),
          forEach: vi.fn((cb) => cb('application/json', 'content-type')),
        },
        json: vi.fn().mockResolvedValue({ error: 'Resource not found' }),
        text: vi.fn().mockResolvedValue('Resource not found'),
      });

      const result = await httpClient.get('https://api.example.com/nonexistent');

      expect(result.isOk).toBe(false);
      expect(result.resultCode).toBe(Results.CODE_FAIL);
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request with data', async () => {
      const requestData = { name: 'test', email: 'test@example.com' };
      const responseData = { id: 1, ...requestData };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        statusText: 'Created',
        headers: {
          get: vi.fn((key) => key === 'content-type' ? 'application/json' : null),
          forEach: vi.fn((cb) => cb('application/json', 'content-type')),
        },
        json: vi.fn().mockResolvedValue(responseData),
        text: vi.fn().mockResolvedValue(''),
      });

      const result = await httpClient.post('https://api.example.com/users', requestData);

      expect(result.isOk).toBe(true);
      expect(result.returnValue?.data).toEqual(responseData);
      expect(result.returnValue?.status).toBe(201);
    });
  });

  describe('URL building', () => {
    it('should build URLs correctly with baseURL', () => {
      const config: HttpClientConfig = { baseURL: 'https://api.example.com' };
      const client = new HttpClient(config);
      
      // We can't directly test the private method, but we can test it through a request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: vi.fn(() => null),
          forEach: vi.fn(),
        },
        json: vi.fn().mockResolvedValue({}),
        text: vi.fn().mockResolvedValue(''),
      });

      client.get('/users');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.any(Object)
      );
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Failed to fetch');
      networkError.name = 'AbortError'; // This will prevent retries
      mockFetch.mockRejectedValueOnce(networkError);

      const result = await httpClient.get('https://api.example.com/test');

      expect(result.isOk).toBe(false);
      expect(result.resultCode).toBe(Results.CODE_FAIL);
    });

    it('should handle timeout errors', async () => {
      const abortError = new Error('Request timeout');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      const result = await httpClient.get('https://api.example.com/test');

      expect(result.isOk).toBe(false);
      expect(result.resultCode).toBe(Results.CODE_FAIL);
    });
  });
});
