/**
 * Standard API response types
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: string;
}

/**
 * Type guard to check if response is successful
 */
export function isSuccessResponse<T>(response: {
  success: true;
  data?: T;
  message?: string;
  error?: string;
}): response is ApiResponse<T> & { success: true; data: T } {
  return (
    response &&
    typeof response === 'object' &&
    response.success === true &&
    response.data !== undefined
  );
}

/**
 * Type guard to check if response is an error
 */
export function isErrorResponse<T>(response: {
  success: false;
  data?: T;
  message?: string;
  error?: string;
}): response is ApiResponse<T> & { success: false } {
  return response && typeof response === 'object' && response.success === false;
}
