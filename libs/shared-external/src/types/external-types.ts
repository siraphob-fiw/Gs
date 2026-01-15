// Basic external service types for Phase 3
export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface EmailConfig {
  provider: 'smtp' | 'sendgrid';
  apiKey?: string;
  from: {
    name: string;
    email: string;
  };
}

export interface EmailMessage {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

export interface EmailResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
}