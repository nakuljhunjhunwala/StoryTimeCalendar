import type { AxiosError } from 'axios';

interface ErrorWithMessage {
  message: string;
}

interface ErrorWithResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

function isErrorWithResponse(error: unknown): error is ErrorWithResponse {
  return typeof error === 'object' && error !== null && 'response' in error;
}

export function getErrorMessage(
  error: unknown,
  fallbackMessage = 'An unexpected error occurred'
): string {
  // Check if it's an Axios error with response data
  if (isErrorWithResponse(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
  }

  // Check if it's a regular error with message
  if (isErrorWithMessage(error)) {
    return error.message;
  }

  // Return fallback message
  return fallbackMessage;
}
