const TOKEN = /^[A-Za-z0-9\-._~+/]+=*$/;

function isToken(value: string): boolean {
  return TOKEN.test(value) && value.length >= 20 && value.length <= 4096;
}

/** Tokens from an invite link fragment. Returns null unless both look like tokens. */
export function sessionFromHash(hash: string): {
  accessToken: string;
  refreshToken: string;
} | null {
  const params = new URLSearchParams(
    hash.startsWith("#") ? hash.slice(1) : hash,
  );
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!accessToken || !refreshToken) return null;
  if (!isToken(accessToken) || !isToken(refreshToken)) return null;
  return { accessToken, refreshToken };
}
