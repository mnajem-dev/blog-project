import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPosts, deletePost, bulkAction } from '../api/posts';
import styles from './PostList.module.css';

const CATEGORIES = ['', 'General', 'Tech', 'Design', 'Business', 'Lifestyle'];
const PAGE_SIZE = 10;

function SortableHeader({ column, sort, onSort, children }) {
  const active = sort.sortBy === column;
  return (
    <th
      className={styles.sortableHeader}
      onClick={() => onSort(column)}
      aria-sort={active ? (sort.sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      {children}
      <span className={`${styles.sortIcon} ${active ? styles.sortIconActive : ''}`}>
        {active ? (sort.sortOrder === 'asc' ? '▲' : '▼') : '⇅'}
      </span>
    </th>
  );
}

export default function PostList() {
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: '', category: '', search: '' });
  const [searchInput, setSearchInput] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [sort, setSort] = useState({ sortBy: 'date', sortOrder: 'desc' });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkRunning, setBulkRunning] = useState(false);

  function toggleSort(column) {
    setSort(s => s.sortBy === column
      ? { sortBy: column, sortOrder: s.sortOrder === 'asc' ? 'desc' : 'asc' }
      : { sortBy: column, sortOrder: 'asc' });
    setPage(1);
  }

  function toggleSelected(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds(prev =>
      prev.size === posts.length ? new Set() : new Set(posts.map(p => p.id))
    );
  }

  async function handleBulkPublish() {
    const ids = Array.from(selectedIds);
    setBulkRunning(true);
    try {
      await bulkAction(ids, 'publish');
      setPosts(ps => ps.map(p => ids.includes(p.id) ? { ...p, status: 'published' } : p));
      setSelectedIds(new Set());
    } catch (e) {
      setError(e.message);
    } finally {
      setBulkRunning(false);
    }
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    if (!window.confirm(`Delete ${ids.length} selected post${ids.length === 1 ? '' : 's'}? This cannot be undone.`)) return;
    setBulkRunning(true);
    try {
      await bulkAction(ids, 'delete');
      setPosts(ps => ps.filter(p => !ids.includes(p.id)));
      setTotal(t => t - ids.length);
      setSelectedIds(new Set());
    } catch (e) {
      setError(e.message);
    } finally {
      setBulkRunning(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await deletePost(id);
      setPosts(ps => ps.filter(p => p.id !== id));
    } catch (e) {
      setError(e.message);
    } finally {
      setDeletingId(null);
    }
  }

  function changeFilters(update) {
    setFilters(f => ({ ...f, ...update }));
    setPage(1);
  }

  useEffect(() => {
    const timer = setTimeout(() => changeFilters({ search: searchInput }), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: PAGE_SIZE, sortBy: sort.sortBy, sortOrder: sort.sortOrder };
    if (filters.status) params.status = filters.status;
    if (filters.category) params.category = filters.category;
    if (filters.search) params.search = filters.search;

    getPosts(params)
      .then(res => { setPosts(res.data); setTotal(res.total); setSelectedIds(new Set()); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [filters, page, sort]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>All Posts <span className={styles.count}>{total}</span></h1>
        <Link to="/create" className={styles.btn}>+ New Post</Link>
      </div>

      <div className={styles.searchBar}>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Search by title, content, or author…"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
        />
      </div>

      <div className={styles.filters}>
        <select value={filters.status} onChange={e => changeFilters({ status: e.target.value })}>
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select value={filters.category} onChange={e => changeFilters({ category: e.target.value })}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c || 'All Categories'}</option>)}
        </select>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {selectedIds.size > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkCount}>{selectedIds.size} selected</span>
          <button className={styles.bulkPublishBtn} onClick={handleBulkPublish} disabled={bulkRunning}>
            {bulkRunning ? 'Working…' : 'Publish Selected'}
          </button>
          <button className={styles.bulkDeleteBtn} onClick={handleBulkDelete} disabled={bulkRunning}>
            {bulkRunning ? 'Working…' : 'Delete Selected'}
          </button>
          <button className={styles.bulkClearBtn} onClick={() => setSelectedIds(new Set())} disabled={bulkRunning}>
            Clear
          </button>
        </div>
      )}

      {loading ? (
        <p className={styles.loading}>Loading...</p>
      ) : posts.length === 0 ? (
        <div className={styles.empty}>
          <p>No posts found.</p>
          <Link to="/create">Create your first post</Link>
        </div>
      ) : (
        <>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.checkboxCell}>
                  <input
                    type="checkbox"
                    checked={posts.length > 0 && selectedIds.size === posts.length}
                    onChange={toggleSelectAll}
                    aria-label="Select all posts on this page"
                  />
                </th>
                <SortableHeader column="id" sort={sort} onSort={toggleSort}>#</SortableHeader>
                <SortableHeader column="title" sort={sort} onSort={toggleSort}>Title</SortableHeader>
                <SortableHeader column="author" sort={sort} onSort={toggleSort}>Author</SortableHeader>
                <SortableHeader column="category" sort={sort} onSort={toggleSort}>Category</SortableHeader>
                <SortableHeader column="status" sort={sort} onSort={toggleSort}>Status</SortableHeader>
                <SortableHeader column="date" sort={sort} onSort={toggleSort}>Date</SortableHeader>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr key={post.id} className={selectedIds.has(post.id) ? styles.selectedRow : ''}>
                  <td className={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(post.id)}
                      onChange={() => toggleSelected(post.id)}
                      aria-label={`Select ${post.title}`}
                    />
                  </td>
                  <td>{post.id}</td>
                  <td className={styles.title}>
                    {post.title}
                    {post.excerpt && <p className={styles.excerpt}>{post.excerpt}</p>}
                  </td>
                  <td>{post.author}</td>
                  <td><span className={styles.category}>{post.category}</span></td>
                  <td>
                    <span className={`${styles.badge} ${styles[post.status]}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className={styles.date}>
                    {new Date(post.published_at || post.created_at).toLocaleDateString()}
                  </td>
                  <td className={styles.actionCell}>
                    <Link to={`/posts/${post.slug}`} className={styles.viewBtn}>View</Link>
                    <button
                      onClick={() => handleDelete(post.id)}
                      disabled={deletingId === post.id}
                      className={styles.deleteBtn}
                    >
                      {deletingId === post.id ? '…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {Math.ceil(total / PAGE_SIZE) > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
            >
              ← Prev
            </button>
            <span className={styles.pageInfo}>
              Page {page} of {Math.ceil(total / PAGE_SIZE)}
            </span>
            <button
              className={styles.pageBtn}
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / PAGE_SIZE)}
            >
              Next →
            </button>
          </div>
        )}
        </>
      )}
    </div>
  );
}
