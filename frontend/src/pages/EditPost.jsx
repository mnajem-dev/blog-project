import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPost, updatePost } from '../api/posts';
import PostPreview from '../components/PostPreview';
import TagInput from '../components/TagInput';
import styles from './CreatePost.module.css';

const CATEGORIES = ['General', 'Tech', 'Design', 'Business', 'Lifestyle'];

export default function EditPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [postId, setPostId] = useState(null);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [tab, setTab] = useState('write');

  useEffect(() => {
    getPost(slug)
      .then(post => {
        setPostId(post.id);
        setForm({
          title: post.title,
          content: post.content,
          author: post.author,
          category: post.category,
          status: post.status,
          tags: post.tags || [],
          slug: post.slug,
        });
      })
      .catch(e => setServerError(e.message));
  }, [slug]);

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.author.trim()) e.author = 'Author is required';
    if (!form.content.trim()) e.content = 'Content is required';
    return e;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    setServerError('');
    try {
      const updated = await updatePost(postId, form);
      navigate(`/posts/${updated.slug}`);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!form && !serverError) return <div className={styles.container}><p style={{ color: '#a6adc8' }}>Loading...</p></div>;

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1 className={styles.heading}>Edit Post</h1>
        <div className={styles.tabs}>
          <button type="button" className={`${styles.tab} ${tab === 'write' ? styles.activeTab : ''}`} onClick={() => setTab('write')}>Write</button>
          <button type="button" className={`${styles.tab} ${tab === 'preview' ? styles.activeTab : ''}`} onClick={() => setTab('preview')}>Preview</button>
        </div>
      </div>

      {serverError && <p className={styles.serverError}>{serverError}</p>}

      {form && tab === 'preview' && <PostPreview {...form} />}

      {form && tab === 'write' && (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label>Title *</label>
            <input name="title" value={form.title} onChange={handleChange} placeholder="Post title" />
            {errors.title && <span className={styles.err}>{errors.title}</span>}
          </div>

          <div className={styles.field}>
            <label>Slug</label>
            <input name="slug" value={form.slug} onChange={handleChange} placeholder="url-friendly-slug" />
            <span className={styles.slugHint}>/posts/{form.slug}</span>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Author *</label>
              <input name="author" value={form.author} onChange={handleChange} placeholder="Author name" />
              {errors.author && <span className={styles.err}>{errors.author}</span>}
            </div>
            <div className={styles.field}>
              <label>Category</label>
              <select name="category" value={form.category} onChange={handleChange}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label>Content *</label>
            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              placeholder="Write your post content..."
              rows={12}
            />
            {errors.content && <span className={styles.err}>{errors.content}</span>}
          </div>

          <div className={styles.field}>
            <label>Tags</label>
            <TagInput tags={form.tags} onChange={tags => setForm(f => ({ ...f, tags }))} />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={() => navigate(`/posts/${slug}`)}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
