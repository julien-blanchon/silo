/**
 * Recursively truncates values in an object or array
 * @param obj - The object to truncate
 * @param maxLength - Maximum length for string values (default: 30)
 * @returns A new object with truncated values
 */
export function truncateJson(obj: any, maxLength: number = 30): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    if (obj.length <= maxLength) {
      return obj;
    }
    const startChars = Math.floor((maxLength - 3) / 2);
    const endChars = maxLength - 3 - startChars;
    return obj.substring(0, startChars) + '...' + obj.substring(obj.length - endChars);
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => truncateJson(item, maxLength));
  }
  
  if (typeof obj === 'object') {
    const truncated: any = {};
    for (const [key, value] of Object.entries(obj)) {
      truncated[key] = truncateJson(value, maxLength);
    }
    return truncated;
  }
  
  return obj;
}

/**
 * Formats JSON for display with proper indentation and truncation
 * @param obj - The object to format
 * @param maxLength - Maximum length for string values (default: 30)
 * @returns Formatted JSON string
 */
export function formatTruncatedJson(obj: any, maxLength: number = 30): string {
  const truncated = truncateJson(obj, maxLength);
  return JSON.stringify(truncated, null, 2);
}
