const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const bcrypt = require('bcryptjs');

let db;

async function getDb() {
  if (!db) {
    db = await open({
      filename: path.join(__dirname, 'blog.db'),
      driver: sqlite3.Database,
    });
    await db.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'General',
        status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Idempotent migration: add tags column if it doesn't exist yet
    try {
      await db.exec(`ALTER TABLE posts ADD COLUMN tags TEXT NOT NULL DEFAULT ''`);
    } catch (_) { /* column already exists */ }
    // Idempotent migration: add published_at column and backfill existing published posts
    try {
      await db.exec(`ALTER TABLE posts ADD COLUMN published_at DATETIME DEFAULT NULL`);
      await db.exec(`UPDATE posts SET published_at = created_at WHERE status = 'published' AND published_at IS NULL`);
    } catch (_) { /* column already exists */ }
    // Idempotent migration: add updated_at column (NULL = never edited after creation)
    try {
      await db.exec(`ALTER TABLE posts ADD COLUMN updated_at DATETIME DEFAULT NULL`);
    } catch (_) { /* column already exists */ }
    // Idempotent migration: add slug column and backfill from title + id
    try {
      await db.exec(`ALTER TABLE posts ADD COLUMN slug TEXT NOT NULL DEFAULT ''`);
      const rows = await db.all(`SELECT id, title FROM posts WHERE slug = ''`);
      for (const row of rows) {
        const base = row.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'post';
        await db.run(`UPDATE posts SET slug = ? WHERE id = ?`, [`${base}-${row.id}`, row.id]);
      }
    } catch (_) { /* column already exists */ }
    // Idempotent migration: add excerpt column for post list previews
    try {
      await db.exec(`ALTER TABLE posts ADD COLUMN excerpt TEXT NOT NULL DEFAULT ''`);
    } catch (_) { /* column already exists */ }
    // Idempotent migration: add featured_image column (relative /uploads URL)
    try {
      await db.exec(`ALTER TABLE posts ADD COLUMN featured_image TEXT DEFAULT NULL`);
    } catch (_) { /* column already exists */ }

    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const { count } = await db.get('SELECT COUNT(*) AS count FROM users');
    if (count === 0) {
      const username = process.env.ADMIN_USERNAME || 'admin';
      const password = process.env.ADMIN_PASSWORD || 'admin123';
      const passwordHash = await bcrypt.hash(password, 10);
      await db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, passwordHash]);
      console.log(`Seeded default admin user "${username}". Set ADMIN_USERNAME/ADMIN_PASSWORD env vars to customize.`);
    }
  }
  return db;
}

module.exports = { getDb };
