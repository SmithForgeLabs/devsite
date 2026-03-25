const SCRIPT_BLOCK_RE = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const DANGEROUS_TAG_RE = /<\s*(iframe|object|embed|base|form)\b[^>]*(?:>[\s\S]*?<\/\s*\1\s*>|\/?>)/gi;
const EVENT_ATTR_RE = /\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi;
const JS_URI_RE = /(\s+(?:href|src|action|formaction|xlink:href)\s*=\s*(?:"[^"]*javascript:[^"]*"|'[^']*javascript:[^']*'|"[^"]*vbscript:[^"]*"|'[^']*vbscript:[^']*'))/gi;
const DATA_URI_RE = /(\s+(?:href|src)\s*=\s*(?:"[^"]*data:text\/html[^"]*"|'[^']*data:text\/html[^']*'))/gi;

export function sanitizeHtml(html: string): string {
  if (typeof html !== "string") return "";

  return html
    .replace(SCRIPT_BLOCK_RE, "")
    .replace(DANGEROUS_TAG_RE, "")
    .replace(EVENT_ATTR_RE, "")
    .replace(JS_URI_RE, "")
    .replace(DATA_URI_RE, "")
    .trim();
}
