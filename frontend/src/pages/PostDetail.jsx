import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPost, deletePost } from '../api/posts';
import { renderMarkdown } from '../utils/markdown';
import styles from './PostDetail.module.css';

export default function PostDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await deletePost(post.id);
      navigate('/');
    } catch (e) {
      setError(e.message);
      setDeleting(false);
    }
  }

  useEffect(() => {
    getPost(slug).then(setPost).catch(e => setError(e.message));
  }, [slug]);

  if (error) return <div className={styles.container}><p className={styles.error}>{error}</p></div>;
  if (!post) return <div className={styles.container}><p className={styles.loading}>Loading...</p></div>;

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <Link to="/" className={styles.back}>← Back to posts</Link>
        <div className={styles.actions}>
          <Link to={`/posts/${post.slug}/edit`} className={styles.editBtn}>Edit</Link>
          <button onClick={handleDelete} disabled={deleting} className={styles.deleteBtn}>
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
      <article className={styles.article}>
        {post.featured_image && <img src={post.featured_image} alt="" className={styles.featuredImage} />}
        <div className={styles.meta}>
          <span className={`${styles.badge} ${styles[post.status]}`}>{post.status}</span>
          <span className={styles.category}>{post.category}</span>
          {post.published_at
            ? <span className={styles.date}>Published {new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            : <span className={styles.date}>Created {new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          }
        </div>
        <h1 className={styles.title}>{post.title}</h1>
        <p className={styles.author}>By {post.author}</p>
        {post.updated_at && (
          <p className={styles.edited}>Last edited {new Date(post.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        )}
        {post.excerpt && <p className={styles.excerpt}>{post.excerpt}</p>}
        <div className={styles.content} dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />
        {post.tags && post.tags.length > 0 && (
          <div className={styles.tags}>
            {post.tags.map(tag => <span key={tag} className={styles.tag}>{tag}</span>)}
          </div>
        )}
      </article>
    </div>
  );
}
