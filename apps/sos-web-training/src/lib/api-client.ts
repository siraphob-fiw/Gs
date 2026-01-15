export class ApiClientWrapper {
  private defaultHeaders: Record<string, string>;
  private readonly API_PREFIX = '/api/v1';
  private baseURL = process.env.APP_URL || 'http://localhost:3001';
  private baseURLWithPrefix = `${this.baseURL}${this.API_PREFIX}`;

  constructor(defaultConfig: { headers?: Record<string, string> } = {}) {
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...defaultConfig.headers,
    };
  }

  async get<T>(
    endpoint: string,
    token?: string,
    headers?: Record<string, string>,
  ): Promise<{ data: T; status: number }> {
    const requestHeaders = {
      ...this.defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    };

    return fetch(`${this.baseURLWithPrefix}${endpoint}`, {
      method: 'GET',
      headers: requestHeaders,
    }).then(async (response) => {
      const text = await response.text();
      const responseData = text ? JSON.parse(text) : null;
      return { data: responseData, status: response.status };
    });
  }

  async post<T>(
    endpoint: string,
    data?: any,
    token?: string,
    headers?: Record<string, string>,
  ): Promise<{ data: T; status: number }> {
    const requestHeaders = {
      ...this.defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    };

    return fetch(`${this.baseURLWithPrefix}${endpoint}`, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(data),
    }).then(async (response) => {
      const text = await response.text();
      const responseData = text ? JSON.parse(text) : null;
      return { data: responseData, status: response.status };
    });
  }

  async put<T>(
    endpoint: string,
    data?: any,
    token?: string,
    headers?: Record<string, string>,
  ): Promise<{ data: T; status: number }> {
    const requestHeaders = {
      ...this.defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    };

    return fetch(`${this.baseURLWithPrefix}${endpoint}`, {
      method: 'PUT',
      headers: requestHeaders,
      body: JSON.stringify(data),
    }).then(async (response) => {
      const text = await response.text();
      const responseData = text ? JSON.parse(text) : null;
      return { data: responseData, status: response.status };
    });
  }

  async patch<T>(
    endpoint: string,
    data?: any,
    token?: string,
    headers?: Record<string, string>,
  ): Promise<{ data: T; status: number }> {
    const requestHeaders = {
      ...this.defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    };

    return fetch(`${this.baseURLWithPrefix}${endpoint}`, {
      method: 'PATCH',
      headers: requestHeaders,
      body: JSON.stringify(data),
    }).then(async (response) => {
      const text = await response.text();
      const responseData = text ? JSON.parse(text) : null;
      return { data: responseData, status: response.status };
    });
  }

  async delete<T>(
    endpoint: string,
    token?: string,
    headers?: Record<string, string>,
  ): Promise<{ data: T; status: number }> {
    const requestHeaders = {
      ...this.defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    };

    return fetch(`${this.baseURLWithPrefix}${endpoint}`, {
      method: 'DELETE',
      headers: requestHeaders,
    }).then(async (response) => {
      const text = await response.text();
      const responseData = text ? JSON.parse(text) : null;
      return { data: responseData, status: response.status };
    });
  }
}

// Create and export the wrapped client with error handling
// Use the configuration validator to get the properly prefixed URL
const wrappedClient = new ApiClientWrapper();

export const apiClient = wrappedClient;
export default wrappedClient;
