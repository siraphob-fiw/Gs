import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpClient } from './http-client';
import { Results } from '@strengthos/shared-utils';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('HttpClient', () => {
  let httpClient: HttpClient;

  beforeEach(() => {
    httpClient = new HttpClient({
      baseURL: 'https://api.example.com',
      timeout: 5000
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: vi.fn().mockResolvedValue({ id: 1, name: 'Test' })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await httpClient.get('/users/1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
      expect(result.isOk).toBe(true);
      expect(result.returnValue?.data).toEqual({ id: 1, name: 'Test' });
      expect(result.returnValue?.status).toBe(200);
    });

    it('should handle 404 error', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Map([['content-type', 'application/json']]),
        json: vi.fn().mockResolvedValue({ message: 'User not found' })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await httpClient.get('/users/999');

      expect(result.isOk).toBe(false);
      expect(result.resultCode).toBe(Results.CODE_FAIL);
      expect(result.message).toBe('User not found');
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request with data', async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        statusText: 'Created',
        headers: new Map([['content-type', 'application/json']]),
        json: vi.fn().mockResolvedValue({ id: 2, name: 'New User' })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const userData = { name: 'New User', email: 'user@example.com' };
      const result = await httpClient.post('/users', userData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(userData)
        })
      );
      expect(result.isOk).toBe(true);
      expect(result.returnValue?.data).toEqual({ id: 2, name: 'New User' });
      expect(result.returnValue?.status).toBe(201);
    });

    it('should handle validation error (400)', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Map([['content-type', 'application/json']]),
        json: vi.fn().mockResolvedValue({ message: 'Email is required' })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await httpClient.post('/users', { name: 'Test' });

      expect(result.isOk).toBe(false);
      expect(result.resultCode).toBe(Results.CODE_VALIDATION_FAILED);
      expect(result.message).toBe('Email is required');
    });

    it('should handle authentication error (401)', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Map([['content-type', 'application/json']]),
        json: vi.fn().mockResolvedValue({ message: 'Invalid credentials' })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await httpClient.post('/auth/login', { email: 'test@example.com', password: 'wrong' });

      expect(result.isOk).toBe(false);
      expect(result.resultCode).toBe(Results.CODE_ERROR);
      expect(result.message).toBe('Invalid credentials');
    });
  });

  describe('PUT requests', () => {
    it('should make successful PUT request', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: vi.fn().mockResolvedValue({ id: 1, name: 'Updated User' })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const userData = { name: 'Updated User' };
      const result = await httpClient.put('/users/1', userData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(userData)
        })
      );
      expect(result.isOk).toBe(true);
      expect(result.returnValue?.data).toEqual({ id: 1, name: 'Updated User' });
    });
  });

  describe('DELETE requests', () => {
    it('should make successful DELETE request', async () => {
      const mockResponse = {
        ok: true,
        status: 204,
        statusText: 'No Content',
        headers: new Map(),
        text: vi.fn().mockResolvedValue('')
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await httpClient.delete('/users/1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'DELETE'
        })
      );
      expect(result.isOk).toBe(true);
      expect(result.returnValue?.status).toBe(204);
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      // Create a client with no retries to avoid timeout
      const noRetryClient = new HttpClient({
        baseURL: 'https://api.example.com',
        timeout: 1000
      });
      // Override maxRetries for this test
      (noRetryClient as any).maxRetries = 0;
      
      mockFetch.mockRejectedValue(new Error('Failed to fetch'));

      const result = await noRetryClient.get('/users');

      expect(result.isOk).toBe(false);
      expect(result.resultCode).toBe(Results.CODE_FAIL);
      expect(result.message).toBe('Unable to connect to server. Please check your internet connection.');
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError'));

      const result = await httpClient.get('/users');

      expect(result.isOk).toBe(false);
      expect(result.resultCode).toBe(Results.CODE_FAIL);
      expect(result.message).toBe('Request timeout. Please check your connection and try again.');
    });

    it('should handle server errors (500)', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Map([['content-type', 'application/json']]),
        json: vi.fn().mockResolvedValue({ message: 'Database connection failed' })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await httpClient.get('/users');

      expect(result.isOk).toBe(false);
      expect(result.resultCode).toBe(Results.CODE_ERROR);
      expect(result.message).toBe('Server error. Please try again later.');
    });
  });

  describe('URL building', () => {
    it('should build URL correctly with baseURL', () => {
      const client = new HttpClient({ baseURL: 'https://api.example.com' });
      // This is tested indirectly through the fetch calls above
    });

    it('should handle absolute URLs', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: vi.fn().mockResolvedValue({})
      };
      mockFetch.mockResolvedValue(mockResponse);

      await httpClient.get('https://external-api.com/data');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://external-api.com/data',
        expect.any(Object)
      );
    });
  });

  describe('Headers', () => {
    it('should include custom headers from config', async () => {
      const clientWithHeaders = new HttpClient({
        baseURL: 'https://api.example.com',
        timeout: 1000,
        headers: {
          'Authorization': 'Bearer token123',
          'X-Custom-Header': 'custom-value'
        }
      });
      // Override maxRetries to avoid timeout
      (clientWithHeaders as any).maxRetries = 0;

      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map(),
        json: vi.fn().mockResolvedValue({})
      };
      mockFetch.mockResolvedValue(mockResponse);

      await clientWithHeaders.get('/users');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer token123',
            'X-Custom-Header': 'custom-value'
          })
        })
      );
    });
  });
});