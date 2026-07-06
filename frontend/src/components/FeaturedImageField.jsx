import { useRef } from 'react';
import styles from './FeaturedImageField.module.css';

export default function FeaturedImageField({ previewUrl, onSelect, onRemove, uploading, error }) {
  const inputRef = useRef(null);

  function handleChange(e) {
    const file = e.target.files?.[0];
    if (file) onSelect(file);
    e.target.value = '';
  }

  return (
    <div className={styles.field}>
      <label>Featured Image</label>
      {previewUrl ? (
        <div className={styles.preview}>
          <img src={previewUrl} alt="Featured" className={styles.previewImg} />
          <div className={styles.previewActions}>
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className={styles.replaceBtn}>
              {uploading ? 'Uploading…' : 'Replace'}
            </button>
            {onRemove && (
              <button type="button" onClick={onRemove} disabled={uploading} className={styles.removeBtn}>
                Remove
              </button>
            )}
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className={styles.pickBtn}>
          {uploading ? 'Uploading…' : '+ Choose image'}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleChange}
        className={styles.hiddenInput}
      />
      {error && <span className={styles.err}>{error}</span>}
    </div>
  );
}
