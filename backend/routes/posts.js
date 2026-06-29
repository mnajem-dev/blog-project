const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

function parseTags(post) {
  return { ...post, tags: post.tags ? post.tags.split(',').map(t => t.trim()).filter(Boolean) : [] };
}

function joinTags(tags) {
  if (!tags) return '';
  return (Array.isArray(tags) ? tags : [tags]).map(t => t.trim()).filter(Boolean).join(',');
}

router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const { status, category, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    let where = '';
    const params = [];
    const filters = [];

    if (status) { filters.push('status = ?'); params.push(status); }
    if (category) { filters.push('category = ?'); params.push(category); }
    if (search) {
      filters.push('(title LIKE ? OR content LIKE ? OR author LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    if (filters.length) where = ' WHERE ' + filters.join(' AND ');

    const { total } = await db.get(`SELECT COUNT(*) AS total FROM posts${where}`, params);
    const posts = await db.all(
      `SELECT * FROM posts${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({ data: posts.map(parseTags), total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const post = await db.get('SELECT * FROM posts WHERE id = ?', req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(parseTags(post));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, content, author, category = 'General', status = 'draft', tags } = req.body;

    if (!title || !content || !author) {
      return res.status(400).json({ error: 'title, content, and author are required' });
    }
    if (!['draft', 'published'].includes(status)) {
      return res.status(400).json({ error: 'status must be draft or published' });
    }

    const db = await getDb();
    const result = await db.run(
      'INSERT INTO posts (title, content, author, category, status, tags) VALUES (?, ?, ?, ?, ?, ?)',
      [title, content, author, category, status, joinTags(tags)]
    );
    const post = await db.get('SELECT * FROM posts WHERE id = ?', result.lastID);
    res.status(201).json(parseTags(post));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const existing = await db.get('SELECT * FROM posts WHERE id = ?', req.params.id);
    if (!existing) return res.status(404).json({ error: 'Post not found' });

    const { title, content, author, category = existing.category, status = existing.status, tags } = req.body;

    if (!title || !content || !author) {
      return res.status(400).json({ error: 'title, content, and author are required' });
    }
    if (!['draft', 'published'].includes(status)) {
      return res.status(400).json({ error: 'status must be draft or published' });
    }

    const tagsValue = tags !== undefined ? joinTags(tags) : existing.tags;

    await db.run(
      'UPDATE posts SET title = ?, content = ?, author = ?, category = ?, status = ?, tags = ? WHERE id = ?',
      [title, content, author, category, status, tagsValue, req.params.id]
    );
    const post = await db.get('SELECT * FROM posts WHERE id = ?', req.params.id);
    res.json(parseTags(post));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const existing = await db.get('SELECT * FROM posts WHERE id = ?', req.params.id);
    if (!existing) return res.status(404).json({ error: 'Post not found' });
    await db.run('DELETE FROM posts WHERE id = ?', req.params.id);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
