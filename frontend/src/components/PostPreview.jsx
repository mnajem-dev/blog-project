import { renderMarkdown } from '../utils/markdown';
import styles from './PostPreview.module.css';

export default function PostPreview({ title, content, author, category, status, tags = [], excerpt, featuredImage }) {
  const isEmpty = !title && !content && !author;

  if (isEmpty) {
    return (
      <div className={styles.empty}>
        <p>Start filling in the form to see a preview.</p>
      </div>
    );
  }

  return (
    <article className={styles.article}>
      {featuredImage && <img src={featuredImage} alt="" className={styles.featuredImage} />}
      <div className={styles.meta}>
        <span className={`${styles.badge} ${styles[status]}`}>{status || 'draft'}</span>
        {category && <span className={styles.category}>{category}</span>}
        {status === 'published' && (
          <span className={styles.previewDate}>Published {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        )}
      </div>
      <h1 className={styles.title}>{title || <em className={styles.placeholder}>Untitled</em>}</h1>
      {author && <p className={styles.author}>By {author}</p>}
      {excerpt && <p className={styles.excerpt}>{excerpt}</p>}
      {content ? (
        <div className={styles.content} dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
      ) : (
        <div className={styles.content}><em className={styles.placeholder}>No content yet.</em></div>
      )}
      {tags.length > 0 && (
        <div className={styles.tags}>
          {tags.map(tag => <span key={tag} className={styles.tag}>{tag}</span>)}
        </div>
      )}
    </article>
  );
}
