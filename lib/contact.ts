// Seller contact helpers.
//
// GroupMe is stored as a pasted link, so we must be careful: a malicious seller
// could paste any URL and we'd turn a friendly "Open group" into a link to
// somewhere hostile. So only a genuine groupme.com link is ever treated as
// clickable — anything else is shown as plain text (and rejected at input).
// (Instagram is safe by construction: we build its URL from a handle, never
// accept an arbitrary URL.)

/** Returns a safe, clickable GroupMe URL, or null if the value isn't one. */
export function groupmeHref(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase();
    const isGroupMe = host === "groupme.com" || host.endsWith(".groupme.com");
    if ((url.protocol === "https:" || url.protocol === "http:") && isGroupMe) {
      return url.toString();
    }
  } catch {
    // not a URL at all
  }
  return null;
}

/** For form validation: a GroupMe field is OK if it's blank or a real link. */
export function isValidGroupme(value: string): boolean {
  const trimmed = value.trim();
  return trimmed === "" || groupmeHref(trimmed) !== null;
}
