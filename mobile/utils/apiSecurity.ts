/**
 * Resolve an Axios request destination and compare only its origin with the
 * API URL compiled into the app. Any malformed or incomplete destination is
 * untrusted by default.
 */
export function isTrustedApiRequestDestination(
  requestUrl: unknown,
  requestBaseUrl: unknown,
  trustedApiUrl: unknown,
): boolean {
  if (
    typeof requestUrl !== "string" ||
    requestUrl.trim() === "" ||
    typeof requestBaseUrl !== "string" ||
    requestBaseUrl.trim() === "" ||
    typeof trustedApiUrl !== "string" ||
    trustedApiUrl.trim() === ""
  ) {
    return false;
  }

  try {
    const trustedOrigin = new URL(trustedApiUrl).origin;
    const destinationOrigin = new URL(requestUrl, requestBaseUrl).origin;
    return destinationOrigin === trustedOrigin;
  } catch {
    return false;
  }
}
