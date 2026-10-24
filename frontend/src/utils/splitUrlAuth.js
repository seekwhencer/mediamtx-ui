// Zerlegt Basic-Auth-Credentials aus einer URL-String.
// Liefert { url, auth }: `url` ohne Credentials, `auth` = "user:pass"
// (oder null, wenn der Wert keine URL mit Credentials ist, z. B. ein Pfadname).
const safeDecode = (s) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

export function splitUrlAuth(value) {
  if (typeof value !== 'string' || !value) return { url: value, auth: null };
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return { url: value, auth: null };
  }
  if (!parsed.username && !parsed.password) return { url: value, auth: null };
  const user = safeDecode(parsed.username);
  const pass = safeDecode(parsed.password);
  const auth = user && pass ? `${user}:${pass}` : user || pass;
  parsed.username = '';
  parsed.password = '';
  return { url: parsed.href, auth };
}
