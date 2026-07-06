const BASE = '/api/posts';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getPosts(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  const res = await fetch(`${BASE}${params ? '?' + params : ''}`);
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
}

export async function getPost(id) {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error('Post not found');
  return res.json();
}

export async function updatePost(id, data) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update post');
  }
  return res.json();
}

export async function deletePost(id) {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete post');
  }
}

export async function createPost(data) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create post');
  }
  return res.json();
}

export async function bulkAction(ids, action) {
  const res = await fetch(`${BASE}/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ ids, action }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Bulk action failed');
  }
  return res.json();
}
