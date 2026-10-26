'use client';

import React, { useMemo } from 'react';
import { formatRichContentForDisplay } from '@/lib/sanitize';
import { useLocalizedText } from '@/lib/i18n';

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

/**
 * Fully reactive bilingual rich text renderer.
 * Automatically falls back to French if English is empty,
 * and seamlessly updates when the English translation completes.
 */
export const LocalizedRichContent: React.FC<{
  fr?: string | null;
  en?: string | null;
  className?: string;
  as?: 'div' | 'article' | 'section';
}> = ({ fr, en, className = '', as = 'div' }) => {
  const text = useLocalizedText(fr, en);
  return (
    <RichTextContent
      content={text}
      fallback={fr || ''}
      className={className}
      as={as}
    />
  );
};

export default RichTextContent;
