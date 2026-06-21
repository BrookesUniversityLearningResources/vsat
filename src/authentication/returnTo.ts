const DEFAULT_RETURN_TO = "/author/story";

export function safeReturnTo(value: string | null | undefined): string {
  if (!value) {
    return DEFAULT_RETURN_TO;
  }

  try {
    const decoded = decodeURIComponent(value);
    if (!decoded.startsWith("/") || decoded.startsWith("//")) {
      return DEFAULT_RETURN_TO;
    }

    return decoded;
  } catch {
    return DEFAULT_RETURN_TO;
  }
}

export function loginPathForReturnTo(returnTo: string): string {
  const safePath = safeReturnTo(returnTo);
  return `/login?returnTo=${encodeURIComponent(safePath)}`;
}
