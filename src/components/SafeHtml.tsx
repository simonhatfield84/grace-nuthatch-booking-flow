
import React from 'react';
import DOMPurify from 'dompurify';

interface SafeHtmlProps {
  html: string;
  className?: string;
  allowedTags?: string[];
}

export const SafeHtml: React.FC<SafeHtmlProps> = ({ 
  html, 
  className, 
  allowedTags = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
}) => {
  const sanitizeHtml = (htmlContent: string) => {
    return DOMPurify.sanitize(htmlContent, {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: ['class'],
      FORBID_SCRIPT: true,
      FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'textarea', 'select'],
      FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit']
    });
  };

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
};
