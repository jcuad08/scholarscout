/**
 * The @google/genai SDK throws ApiError instances whose `.message` is often
 * the raw upstream JSON, e.g.:
 *
 *   '{"error":{"code":400,"message":"API key not valid...","status":"INVALID_ARGUMENT"}}'
 *
 * Surfacing that verbatim to the UI gives users a wall of escaped JSON.
 * This helper extracts the human-readable `.error.message` field when the
 * SDK message happens to be JSON, and falls through to the original string
 * otherwise (network errors, our own throws, etc.).
 */
export function humanizeGeminiError(message: string): string {
  try {
    const parsed = JSON.parse(message);
    const inner = parsed?.error?.message;
    if (typeof inner === "string" && inner.length > 0) return inner;
  } catch {
    // not JSON — fall through to the original string
  }
  return message;
}
