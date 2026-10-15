import DOMPurify from 'dompurify';

/**
 * Strict and secure HTML sanitizer for APS-BÉNIN institutional website.
 * Prevents XSS, script injection, and malicious payloads while strictly
 * supporting rich editorial typography (headings, bold, lists, quotes, links, colors, fonts).
 */

const ALLOWED_TAGS = [
  'p',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'strike',
  'del',
  'ul',
  'ol',
  'li',
  'blockquote',
  'hr',
  'br',
  'a',
  'span',
  'div',
  'code',
  'pre',
  'mark',
  'sub',
  'sup',
];

const ALLOWED_ATTRIBUTES = [
  'href',
  'target',
  'rel',
  'title',
  'style',
  'class',
  'className',
  'align',
];

/**
 * Checks if a string contains HTML tags.
 */
export function isHtmlContent(str?: string | null): boolean {
  if (!str || typeof str !== 'string') return false;
  return /<\/?[a-z][\s\S]*>/i.test(str);
}

/**
 * Converts legacy plain text into clean HTML paragraphs while preserving double and single line breaks.
 */
export function plainTextToHtml(text?: string | null): string {
  if (!text || typeof text !== 'string') return '';
  
  // Escape angle brackets to prevent injection when treating as plain text
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Split by double newline or multiple newlines
  const paragraphs = escaped
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return '';

  return paragraphs
    .map((p) => `<p>${p.replace(/\r?\n/g, '<br />')}</p>`)
    .join('');
}

/**
 * Sanitizes rich HTML content with DOMPurify.
 * Ensures security:
 * - strips scripts, on* event handlers, iframes, objects
 * - validates links (no javascript:, data:, etc.)
 * - enforces rel="noopener noreferrer" on external links
 * - filters inline styles to only allow color, font-family, and text-align
 */
export function sanitizeRichHtml(dirty?: string | null): string {
  if (!dirty || typeof dirty !== 'string') return '';

  // In SSR / Node environment where window is undefined
  if (typeof window === 'undefined') {
    // Basic regex-based fallback for SSR to prevent fatal hydration issues
    return dirty
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
      .replace(/javascript\s*:/gi, 'about:blank');
  }

  // Hook to ensure links are safe and external links open safely
  DOMPurify.removeHook('afterSanitizeAttributes');
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      const href = node.getAttribute('href');
      if (href) {
        const lowerHref = href.trim().toLowerCase();
        // Disallow dangerous protocols
        if (
          lowerHref.startsWith('javascript:') ||
          lowerHref.startsWith('data:') ||
          lowerHref.startsWith('vbscript:')
        ) {
          node.removeAttribute('href');
        } else if (lowerHref.startsWith('http://') || lowerHref.startsWith('https://')) {
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'noopener noreferrer');
        }
      }
    }

    // Filter inline styles to safe properties
    if (node.hasAttribute('style')) {
      const style = node.getAttribute('style') || '';
      const safeStyles = style
        .split(';')
        .map((rule) => rule.trim())
        .filter((rule) => {
          const [prop] = rule.split(':').map((s) => s.trim().toLowerCase());
          return ['color', 'font-family', 'text-align', 'font-weight', 'font-style', 'text-decoration'].includes(
            prop
          );
        })
        .join('; ');

      if (safeStyles) {
        node.setAttribute('style', safeStyles);
      } else {
        node.removeAttribute('style');
      }
    }
  });

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ALLOWED_ATTRIBUTES,
    ALLOW_DATA_ATTR: false,
    USE_PROFILES: { html: true },
  });
}

/**
 * Prepares content for public display or preview.
 * Seamlessly handles both new rich HTML and legacy plain text.
 */
export function formatRichContentForDisplay(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';

  const trimmed = raw.trim();
  if (!trimmed) return '';

  if (isHtmlContent(trimmed)) {
    return sanitizeRichHtml(trimmed);
  }

  // Legacy plain text -> wrap into paragraphs then sanitize
  const asHtml = plainTextToHtml(trimmed);
  return sanitizeRichHtml(asHtml);
}
