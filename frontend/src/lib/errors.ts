import { AxiosError } from 'axios'

interface BackendError {
  error?: { code?: string; message?: string }
  message?: string | string[]
}

/**
 * Pull the human-readable message out of an API error.
 * Backend errors are shaped `{ success: false, error: { code, message } }`,
 * but some (e.g. validation) may use `{ message }`. Falls back to the given
 * text only when the server returned nothing usable (e.g. a network failure).
 */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as BackendError | undefined
    const msg = data?.error?.message ?? data?.message
    if (Array.isArray(msg)) return msg.join(', ')
    if (msg) return msg
    // No response body → connection/network problem.
    if (!err.response) return 'Cannot reach the server. Check your connection.'
  }
  return fallback
}
