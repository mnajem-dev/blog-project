const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const router = express.Router();
const { getDb } = require('../database');
const { requireAuth } = require('../middleware/auth');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const ALLOWED_MIME_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${ALLOWED_MIME_TYPES[file.mimetype]}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, Boolean(ALLOWED_MIME_TYPES[file.mimetype])),
});

function deleteUploadedFile(featuredImage) {
  if (!featuredImage) return;
  const filePath = path.join(UPLOADS_DIR, path.basename(featuredImage));
  fs.unlink(filePath, () => {});
}

function parseTags(post) {
  return { ...post, tags: post.tags ? post.tags.split(',').map(t => t.trim()).filter(Boolean) : [] };
}

function joinTags(tags) {
  if (!tags) return '';
  return (Array.isArray(tags) ? tags : [tags]).map(t => t.trim()).filter(Boolean).join(',');
}

function slugify(text) {
  return (text || '').toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'post';
}

async function uniqueSlug(db, base, excludeId = null) {
  let slug = base; let n = 2;
  while (true) {
    const row = excludeId
      ? await db.get('SELECT id FROM posts WHERE slug = ? AND id != ?', [slug, excludeId])
      : await db.get('SELECT id FROM posts WHERE slug = ?', [slug]);
    if (!row) return slug;
    slug = `${base}-${n++}`;
  }
}

const SORTABLE_COLUMNS = {
  id: 'id',
  title: 'title',
  author: 'author',
  category: 'category',
  status: 'status',
  date: 'COALESCE(published_at, created_at)',
};

router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const { status, category, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const sortColumn = SORTABLE_COLUMNS[req.query.sortBy] || SORTABLE_COLUMNS.date;
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';

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
      `SELECT * FROM posts${where} ORDER BY ${sortColumn} ${sortOrder} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({ data: posts.map(parseTags), total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:identifier', async (req, res) => {
  try {
    const db = await getDb();
    const { identifier } = req.params;
    const post = /^\d+$/.test(identifier)
      ? await db.get('SELECT * FROM posts WHERE id = ?', identifier)
      : await db.get('SELECT * FROM posts WHERE slug = ?', identifier);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(parseTags(post));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, content, author, category = 'General', status = 'draft', tags, slug: rawSlug, excerpt = '' } = req.body;

    if (!title || !content || !author) {
      return res.status(400).json({ error: 'title, content, and author are required' });
    }
    if (!['draft', 'published'].includes(status)) {
      return res.status(400).json({ error: 'status must be draft or published' });
    }

    const publishedAt = status === 'published' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;

    const db = await getDb();
    const slug = await uniqueSlug(db, slugify(rawSlug || title));
    const result = await db.run(
      'INSERT INTO posts (title, content, author, category, status, tags, published_at, slug, excerpt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, content, author, category, status, joinTags(tags), publishedAt, slug, excerpt.trim()]
    );
    const post = await db.get('SELECT * FROM posts WHERE id = ?', result.lastID);
    res.status(201).json(parseTags(post));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const existing = await db.get('SELECT * FROM posts WHERE id = ?', req.params.id);
    if (!existing) return res.status(404).json({ error: 'Post not found' });

    const { title, content, author, category = existing.category, status = existing.status, tags, slug: rawSlug, excerpt } = req.body;

    if (!title || !content || !author) {
      return res.status(400).json({ error: 'title, content, and author are required' });
    }
    if (!['draft', 'published'].includes(status)) {
      return res.status(400).json({ error: 'status must be draft or published' });
    }

    const tagsValue = tags !== undefined ? joinTags(tags) : existing.tags;
    const excerptValue = excerpt !== undefined ? excerpt.trim() : existing.excerpt;
    const publishedAt = (status === 'published' && !existing.published_at)
      ? new Date().toISOString().slice(0, 19).replace('T', ' ')
      : existing.published_at;
    const updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const slugValue = rawSlug !== undefined
      ? await uniqueSlug(db, slugify(rawSlug), existing.id)
      : existing.slug;

    await db.run(
      'UPDATE posts SET title = ?, content = ?, author = ?, category = ?, status = ?, tags = ?, published_at = ?, updated_at = ?, slug = ?, excerpt = ? WHERE id = ?',
      [title, content, author, category, status, tagsValue, publishedAt, updatedAt, slugValue, excerptValue, req.params.id]
    );
    const post = await db.get('SELECT * FROM posts WHERE id = ?', req.params.id);
    res.json(parseTags(post));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const existing = await db.get('SELECT * FROM posts WHERE id = ?', req.params.id);
    if (!existing) return res.status(404).json({ error: 'Post not found' });
    await db.run('DELETE FROM posts WHERE id = ?', req.params.id);
    deleteUploadedFile(existing.featured_image);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/image', requireAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'image file is required (jpeg, png, webp, or gif, max 5MB)' });

    const db = await getDb();
    const existing = await db.get('SELECT * FROM posts WHERE id = ?', req.params.id);
    if (!existing) {
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({ error: 'Post not found' });
    }

    const featuredImage = `/uploads/${req.file.filename}`;
    await db.run('UPDATE posts SET featured_image = ? WHERE id = ?', [featuredImage, req.params.id]);
    deleteUploadedFile(existing.featured_image);

    const post = await db.get('SELECT * FROM posts WHERE id = ?', req.params.id);
    res.json(parseTags(post));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id/image', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const existing = await db.get('SELECT * FROM posts WHERE id = ?', req.params.id);
    if (!existing) return res.status(404).json({ error: 'Post not found' });

    await db.run('UPDATE posts SET featured_image = NULL WHERE id = ?', req.params.id);
    deleteUploadedFile(existing.featured_image);

    const post = await db.get('SELECT * FROM posts WHERE id = ?', req.params.id);
    res.json(parseTags(post));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/bulk', requireAuth, async (req, res) => {
  try {
    const { ids, action } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || !ids.every(id => Number.isInteger(id))) {
      return res.status(400).json({ error: 'ids must be a non-empty array of integers' });
    }
    if (!['publish', 'delete'].includes(action)) {
      return res.status(400).json({ error: 'action must be publish or delete' });
    }

    const db = await getDb();
    const placeholders = ids.map(() => '?').join(',');

    if (action === 'delete') {
      const toDelete = await db.all(`SELECT featured_image FROM posts WHERE id IN (${placeholders})`, ids);
      await db.run(`DELETE FROM posts WHERE id IN (${placeholders})`, ids);
      toDelete.forEach(row => deleteUploadedFile(row.featured_image));
    } else {
      const publishedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
      await db.run(
        `UPDATE posts SET status = 'published', published_at = COALESCE(published_at, ?) WHERE id IN (${placeholders})`,
        [publishedAt, ...ids]
      );
    }

    res.json({ updated: ids.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
