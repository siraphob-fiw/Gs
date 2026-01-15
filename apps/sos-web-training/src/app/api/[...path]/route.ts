import { NextRequest, NextResponse } from 'next/server';
import apiClient from '@/lib/api-client';

// App Router route segment config - increase body size limit for large templates
export const maxDuration = 60; // seconds

function getAuthToken(request: NextRequest): string | undefined {
  // First try Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Fall back to access_token cookie
  const accessToken = request.cookies.get('auth_access_token')?.value;
  return accessToken;
}

/**
 * Extract headers that should be forwarded to the backend API
 */
function getForwardedHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {};

  // Forward x-tenant-id header
  const tenantId = request.headers.get('x-tenant-id');
  if (tenantId) {
    headers['x-tenant-id'] = tenantId;
  }

  // Forward x-user-id header
  const userId = request.headers.get('x-user-id');
  if (userId) {
    headers['x-user-id'] = userId;
  }

  // Forward x-refresh-token header
  const refreshToken = request.headers.get('x-refresh-token');
  if (refreshToken) {
    headers['x-refresh-token'] = refreshToken;
  }

  return headers;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params;
    const pathString = path.join('/');
    const searchParams = request.nextUrl.searchParams.toString();
    const url = searchParams ? `/${pathString}?${searchParams}` : `/${pathString}`;
    const token = getAuthToken(request);
    const forwardedHeaders = getForwardedHeaders(request);

    const response = await apiClient.get(url, token, forwardedHeaders);
    return NextResponse.json(response.data);
  } catch (error: any) {
    // Pass through the exact error response from the backend
    const errorData = error.data || { message: error.message };
    const status = error.status || 500;

    return NextResponse.json(errorData, { status });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params;
    const pathString = path.join('/');
    const token = getAuthToken(request);
    const forwardedHeaders = getForwardedHeaders(request);

    // Check content type to determine how to parse body
    const contentType = request.headers.get('content-type') || '';
    let body: any;

    if (contentType.includes('multipart/form-data')) {
      // For file uploads, pass FormData directly
      body = await request.formData();
    } else if (contentType.includes('application/json')) {
      // For JSON, parse as JSON
      body = await request.json().catch(() => ({}));
    } else {
      // For other types or empty body, use empty object
      body = {};
    }

    const response = await apiClient.post(`/${pathString}`, body, token, forwardedHeaders);
    return NextResponse.json(response.data);
  } catch (error: any) {
    // Pass through the exact error response from the backend
    const errorData = error.data || { message: error.message };
    const status = error.status || 500;

    // Log error details for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('[API Proxy] POST error:', {
        status,
        errorData,
        hasResponse: !!error.data,
      });
    }

    return NextResponse.json(errorData, { status });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params;
    const pathString = path.join('/');
    const token = getAuthToken(request);
    const forwardedHeaders = getForwardedHeaders(request);

    // Check content type to determine how to parse body
    const contentType = request.headers.get('content-type') || '';
    let body: any;

    if (contentType.includes('multipart/form-data')) {
      // For file uploads, pass FormData directly
      body = await request.formData();
    } else if (contentType.includes('application/json')) {
      // For JSON, parse as JSON
      body = await request.json().catch(() => ({}));
    } else {
      // For other types or empty body, use empty object
      body = {};
    }

    const response = await apiClient.put(`/${pathString}`, body, token, forwardedHeaders);
    return NextResponse.json(response.data);
  } catch (error: any) {
    // Pass through the exact error response from the backend
    const errorData = error.data || { message: error.message };
    const status = error.status || 500;

    return NextResponse.json(errorData, { status });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params;
    const pathString = path.join('/');
    const token = getAuthToken(request);
    const forwardedHeaders = getForwardedHeaders(request);

    // Check content type to determine how to parse body
    const contentType = request.headers.get('content-type') || '';
    let body: any;

    if (contentType.includes('multipart/form-data')) {
      // For file uploads, pass FormData directly
      body = await request.formData();
    } else if (contentType.includes('application/json')) {
      // For JSON, parse as JSON
      body = await request.json().catch(() => ({}));
    } else {
      // For other types or empty body, use empty object
      body = {};
    }

    const response = await apiClient.patch(`/${pathString}`, body, token, forwardedHeaders);
    return NextResponse.json(response.data);
  } catch (error: any) {
    // Pass through the exact error response from the backend
    const errorData = error.data || { message: error.message };
    const status = error.status || 500;

    return NextResponse.json(errorData, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params;
    const pathString = path.join('/');
    const token = getAuthToken(request);
    const forwardedHeaders = getForwardedHeaders(request);

    const response = await apiClient.delete(`/${pathString}`, token, forwardedHeaders);
    return NextResponse.json(response.data);
  } catch (error: any) {
    // Pass through the exact error response from the backend
    const errorData = error.data || { message: error.message };
    const status = error.status || 500;

    return NextResponse.json(errorData, { status });
  }
}
