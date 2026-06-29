import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../api/posts';
import PostPreview from '../components/PostPreview';
import TagInput from '../components/TagInput';
import styles from './CreatePost.module.css';

const CATEGORIES = ['General', 'Tech', 'Design', 'Business', 'Lifestyle'];

const INITIAL = { title: '', content: '', author: '', category: 'General', status: 'draft', tags: [] };

export default function CreatePost() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [tab, setTab] = useState('write');

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
      const post = await createPost(form);
      navigate(`/posts/${post.id}`);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1 className={styles.heading}>New Post</h1>
        <div className={styles.tabs}>
          <button type="button" className={`${styles.tab} ${tab === 'write' ? styles.activeTab : ''}`} onClick={() => setTab('write')}>Write</button>
          <button type="button" className={`${styles.tab} ${tab === 'preview' ? styles.activeTab : ''}`} onClick={() => setTab('preview')}>Preview</button>
        </div>
      </div>

      {serverError && <p className={styles.serverError}>{serverError}</p>}

      {tab === 'preview' ? (
        <PostPreview {...form} />
      ) : (
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label>Title *</label>
          <input name="title" value={form.title} onChange={handleChange} placeholder="Post title" />
          {errors.title && <span className={styles.err}>{errors.title}</span>}
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
          <button type="button" className={styles.cancelBtn} onClick={() => navigate('/')}>
            Cancel
          </button>
          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Post'}
          </button>
        </div>
      </form>
      )}
    </div>
  );
}
