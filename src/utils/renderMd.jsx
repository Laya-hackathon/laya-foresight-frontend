/**
 * Minimal markdown renderer for AI-generated text.
 * Handles: **bold**, *italic*, `code`, # headings, - / * bullet lists, numbered lists, blank lines.
 */

function parseInline(text, keyBase = '') {
  const parts = [];
  const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let match;
  let n = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[0].startsWith('**')) {
      parts.push(<strong key={`${keyBase}-b${n++}`}>{match[2]}</strong>);
    } else if (match[0].startsWith('*')) {
      parts.push(<em key={`${keyBase}-i${n++}`}>{match[3]}</em>);
    } else {
      parts.push(
        <code key={`${keyBase}-c${n++}`}
          style={{ fontFamily: 'var(--mono)', fontSize: '0.88em', background: 'var(--surface3)', padding: '1px 4px', borderRadius: 3 }}>
          {match[4]}
        </code>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

/**
 * Renders a multi-line markdown string as React elements.
 * @param {string} text
 * @param {object} [style] - optional override styles for paragraph elements
 */
export function renderMd(text, style = {}) {
  if (!text) return null;
  const lines = text.split('\n');
  const els = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Blank line
    if (!trimmed) {
      els.push(<div key={i} style={{ height: '.4rem' }} />);
      i++;
      continue;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      els.push(<div key={i} style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', margin: '.5rem 0 .2rem' }}>{parseInline(trimmed.slice(4), String(i))}</div>);
      i++; continue;
    }
    if (trimmed.startsWith('## ')) {
      els.push(<div key={i} style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', margin: '.6rem 0 .25rem' }}>{parseInline(trimmed.slice(3), String(i))}</div>);
      i++; continue;
    }
    if (trimmed.startsWith('# ')) {
      els.push(<div key={i} style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', margin: '.7rem 0 .3rem' }}>{parseInline(trimmed.slice(2), String(i))}</div>);
      i++; continue;
    }

    // Bullet list item  (- text  or  * text  or  • text)
    if (/^[-*•] /.test(trimmed)) {
      els.push(
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 2 }}>
          <span style={{ color: 'var(--faint)', flexShrink: 0, marginTop: 1 }}>·</span>
          <span>{parseInline(trimmed.slice(2), String(i))}</span>
        </div>
      );
      i++; continue;
    }

    // Numbered list  (1. text)
    const numMatch = trimmed.match(/^(\d+)\. (.+)/);
    if (numMatch) {
      els.push(
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 2 }}>
          <span style={{ color: 'var(--faint)', flexShrink: 0, fontFamily: 'var(--mono)', fontSize: '0.9em', minWidth: 16 }}>{numMatch[1]}.</span>
          <span>{parseInline(numMatch[2], String(i))}</span>
        </div>
      );
      i++; continue;
    }

    // Normal paragraph
    els.push(
      <p key={i} style={{ marginBottom: '.25rem', lineHeight: 1.75, ...style }}>
        {parseInline(trimmed, String(i))}
      </p>
    );
    i++;
  }

  return els;
}

/**
 * Renders inline markdown only (no block-level). For single-line use (e.g. typewriter).
 */
export function renderInline(text) {
  if (!text) return null;
  return parseInline(text);
}
