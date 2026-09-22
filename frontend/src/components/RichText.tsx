import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';

interface RichTextProps {
  /** Conteúdo vindo do banco: pode ser HTML (editores legados) ou texto puro (TagTextarea). */
  content: string | null | undefined;
  className?: string;
}

// Detecta se o conteúdo carrega marcação. Os campos de configuração convivem em
// duas eras: o Summernote legado gravou HTML, os TagTextarea atuais gravam texto puro.
const hasMarkup = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);

// O conteúdo legado veio de colagens no Summernote e carrega `style` inline com
// cores fixas (texto escuro sobre fundo branco), que quebram o tema escuro.
// Descartamos o atributo e deixamos o conteúdo herdar o tema do app.
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'span', 'div',
    'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'hr', 'sub', 'sup', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
  ],
  ALLOWED_ATTR: ['href', 'title', 'class', 'target', 'rel', 'colspan', 'rowspan'],
  FORBID_ATTR: ['style'],
  ALLOW_DATA_ATTR: false
};

/**
 * Renderiza conteúdo de configuração vindo do Supabase.
 *
 * HTML passa pelo DOMPurify antes de ir para o DOM; texto puro é renderizado como
 * texto mesmo, preservando as quebras de linha.
 */
export const RichText: React.FC<RichTextProps> = ({ content, className = '' }) => {
  const value = content ?? '';

  const sanitized = useMemo(
    () => (hasMarkup(value) ? DOMPurify.sanitize(value, PURIFY_CONFIG) : null),
    [value]
  );

  if (!value.trim()) return null;

  if (sanitized === null) {
    return <div className={`whitespace-pre-line ${className}`}>{value}</div>;
  }

  return (
    <div
      className={`rich-text ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
};

export default RichText;
