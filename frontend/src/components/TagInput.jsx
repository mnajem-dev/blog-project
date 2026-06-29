import { useRef, useState } from 'react';
import styles from './TagInput.module.css';

export default function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  function addTag(raw) {
    const value = raw.trim().toLowerCase();
    if (value && !tags.includes(value)) {
      onChange([...tags, value]);
    }
    setInput('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  function removeTag(tag) {
    onChange(tags.filter(t => t !== tag));
  }

  return (
    <div className={styles.container} onClick={() => inputRef.current?.focus()}>
      {tags.map(tag => (
        <span key={tag} className={styles.tag}>
          {tag}
          <button type="button" className={styles.remove} onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>×</button>
        </span>
      ))}
      <input
        ref={inputRef}
        className={styles.input}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => input.trim() && addTag(input)}
        placeholder={tags.length === 0 ? 'Add tags (press Enter or comma)' : ''}
      />
    </div>
  );
}
