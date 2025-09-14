// Utility functions for handling API responses

/**
 * Safely extract array data from API responses
 * Handles both direct arrays and nested object responses
 */
export const extractArrayData = <T>(data: unknown, arrayKey?: string): T[] => {
  // If data is already an array, return it
  if (Array.isArray(data)) {
    return data as T[];
  }

  // If data is an object and we have an array key, try to extract it
  if (data && typeof data === 'object' && arrayKey) {
    const nestedData = (data as Record<string, unknown>)[arrayKey];
    if (Array.isArray(nestedData)) {
      return nestedData as T[];
    }
  }

  // If data is an object with common array property names, try those
  if (data && typeof data === 'object') {
    const commonArrayKeys = ['items', 'data', 'results', 'list'];
    for (const key of commonArrayKeys) {
      const nestedData = (data as Record<string, unknown>)[key];
      if (Array.isArray(nestedData)) {
        return nestedData as T[];
      }
    }
  }

  // Fallback to empty array
  return [];
};

/**
 * Safely extract single object data from API responses
 */
export const extractObjectData = <T>(data: unknown, objectKey?: string): T | null => {
  // If data is already the right type, return it
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    if (objectKey) {
      const nestedData = (data as Record<string, unknown>)[objectKey];
      return (nestedData as T) || null;
    }
    return data as T;
  }

  return null;
};

/**
 * Check if an API response indicates success
 */
export const isSuccessResponse = (response: unknown): boolean => {
  if (response && typeof response === 'object') {
    const resp = response as Record<string, unknown>;
    return resp.success === true || resp.status === 'success';
  }
  return false;
};
