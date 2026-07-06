import styles from './MarkdownToolbar.module.css';

function wrapSelection(textarea, value, onChange, before, after = before) {
  const { selectionStart: start, selectionEnd: end } = textarea;
  const selected = value.slice(start, end) || 'text';
  const next = value.slice(0, start) + before + selected + after + value.slice(end);
  onChange(next);
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
  });
}

function prefixLines(textarea, value, onChange, prefix) {
  const { selectionStart: start, selectionEnd: end } = textarea;
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const lineEnd = value.indexOf('\n', end);
  const sliceEnd = lineEnd === -1 ? value.length : lineEnd;
  const block = value.slice(lineStart, sliceEnd);
  const prefixed = block
    .split('\n')
    .map((line, i) => (typeof prefix === 'function' ? prefix(line, i) : prefix + line))
    .join('\n');
  const next = value.slice(0, lineStart) + prefixed + value.slice(sliceEnd);
  onChange(next);
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(lineStart, lineStart + prefixed.length);
  });
}

const BUTTONS = [
  { label: 'H1', title: 'Heading 1', action: (ta, v, oc) => prefixLines(ta, v, oc, '# ') },
  { label: 'H2', title: 'Heading 2', action: (ta, v, oc) => prefixLines(ta, v, oc, '## ') },
  { label: 'B', title: 'Bold', className: 'bold', action: (ta, v, oc) => wrapSelection(ta, v, oc, '**') },
  { label: 'I', title: 'Italic', className: 'italic', action: (ta, v, oc) => wrapSelection(ta, v, oc, '*') },
  { label: '"', title: 'Quote', action: (ta, v, oc) => prefixLines(ta, v, oc, '> ') },
  { label: '• List', title: 'Bulleted list', action: (ta, v, oc) => prefixLines(ta, v, oc, '- ') },
  { label: '1. List', title: 'Numbered list', action: (ta, v, oc) => prefixLines(ta, v, oc, (_, i) => `${i + 1}. `) },
  { label: '</>', title: 'Inline code', action: (ta, v, oc) => wrapSelection(ta, v, oc, '`') },
  { label: 'Link', title: 'Link', action: (ta, v, oc) => wrapSelection(ta, v, oc, '[', '](https://)') },
];

export default function MarkdownToolbar({ textareaRef, value, onChange }) {
  return (
    <div className={styles.toolbar}>
      {BUTTONS.map(btn => (
        <button
          key={btn.label}
          type="button"
          title={btn.title}
          className={`${styles.btn} ${btn.className ? styles[btn.className] : ''}`}
          onClick={() => textareaRef.current && btn.action(textareaRef.current, value, onChange)}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
