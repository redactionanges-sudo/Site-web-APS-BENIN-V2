'use client';

import React, { useMemo } from 'react';
import { formatRichContentForDisplay } from '@/lib/sanitize';

interface RichTextContentProps {
  content?: string | null;
  className?: string;
  fallback?: string;
  as?: 'div' | 'article' | 'section';
}

/**
 * Universal safe rich text renderer for APS-BÉNIN public and admin preview.
 * - Enforces rigorous DOMPurify sanitization (prevents XSS).
 * - Backwards-compatible with legacy plain text (automatically converted to clean paragraphs).
 * - Applies APS-BÉNIN design system typography (Open Sans body, Montserrat headings, purple accents).
 */
export const RichTextContent: React.FC<RichTextContentProps> = ({
  content,
  className = '',
  fallback = '',
  as: Component = 'div',
}) => {
  const sanitizedHtml = useMemo(() => {
    const raw = content || fallback || '';
    return formatRichContentForDisplay(raw);
  }, [content, fallback]);

  if (!sanitizedHtml) {
    return null;
  }

  return (
    <Component
      className={`aps-rich-content font-sans text-gray-700 leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

export default RichTextContent;
