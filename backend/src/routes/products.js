import { Router } from 'express';
import { db } from '../db.js';
import { computeExpiryDate, computeStatus, daysRemaining, CATEGORIES, EXPIRY_TYPES } from '../utils/expiry.js';

const router = Router();

function serialize(row) {
  return {
    ...row,
    archived: !!row.archived,
    status: computeStatus(row.expiryDate),
    remainingDays: daysRemaining(row.expiryDate),
  };
}

function validatePayload(body) {
  const { name, category, expiryType } = body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new Error('Product name is required');
  }
  if (category && !CATEGORIES.includes(category)) {
    throw new Error(`Invalid category: ${category}`);
  }
  if (!EXPIRY_TYPES.includes(expiryType)) {
    throw new Error(`Invalid expiryType: ${expiryType}`);
  }
}

router.get('/meta', (req, res) => {
  res.json({ categories: CATEGORIES, expiryTypes: EXPIRY_TYPES });
});

router.get('/', (req, res) => {
  const { archived } = req.query;
  const archivedFlag = archived === 'true' ? 1 : 0;
  const rows = db
    .prepare('SELECT * FROM products WHERE userId = ? AND archived = ? ORDER BY expiryDate ASC')
    .all(req.userId, archivedFlag);
  res.json(rows.map(serialize));
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ? AND userId = ?').get(req.params.id, req.userId);
  if (!row) return res.status(404).json({ error: 'Product not found' });
  res.json(serialize(row));
});

router.post('/', (req, res) => {
  try {
    validatePayload(req.body);
    const { name, category = 'Other', batchNumber = null, quantity = null, manufacturingDate = null, expiryType, expiryValue = null, expiryDate: exactDate = null } = req.body;
    const expiryDate = computeExpiryDate({ manufacturingDate, expiryType, expiryValue, expiryDate: exactDate });

    const stmt = db.prepare(`
      INSERT INTO products (userId, name, category, batchNumber, quantity, manufacturingDate, expiryType, expiryValue, expiryDate, updatedAt)
      VALUES (@userId, @name, @category, @batchNumber, @quantity, @manufacturingDate, @expiryType, @expiryValue, @expiryDate, datetime('now'))
    `);
    const info = stmt.run({ userId: req.userId, name: name.trim(), category, batchNumber, quantity, manufacturingDate, expiryType, expiryValue, expiryDate });
    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(serialize(row));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/bulk', (req, res) => {
  const items = req.body.items;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items must be a non-empty array' });
  }
  const stmt = db.prepare(`
    INSERT INTO products (userId, name, category, batchNumber, quantity, manufacturingDate, expiryType, expiryValue, expiryDate, updatedAt)
    VALUES (@userId, @name, @category, @batchNumber, @quantity, @manufacturingDate, @expiryType, @expiryValue, @expiryDate, datetime('now'))
  `);

  const created = [];
  const errors = [];
  const insertMany = db.transaction((rows) => {
    rows.forEach((item, idx) => {
      try {
        validatePayload(item);
        const { name, category = 'Other', batchNumber = null, quantity = null, manufacturingDate = null, expiryType, expiryValue = null, expiryDate: exactDate = null } = item;
        const expiryDate = computeExpiryDate({ manufacturingDate, expiryType, expiryValue, expiryDate: exactDate });
        const info = stmt.run({ userId: req.userId, name: name.trim(), category, batchNumber, quantity, manufacturingDate, expiryType, expiryValue, expiryDate });
        created.push(serialize(db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid)));
      } catch (err) {
        errors.push({ index: idx, error: err.message, item });
      }
    });
  });
  insertMany(items);

  res.status(errors.length && !created.length ? 400 : 201).json({ created, errors });
});

router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM products WHERE id = ? AND userId = ?').get(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    validatePayload(req.body);
    const { name, category = 'Other', batchNumber = null, quantity = null, manufacturingDate = null, expiryType, expiryValue = null, expiryDate: exactDate = null } = req.body;
    const expiryDate = computeExpiryDate({ manufacturingDate, expiryType, expiryValue, expiryDate: exactDate });

    db.prepare(`
      UPDATE products SET name=@name, category=@category, batchNumber=@batchNumber, quantity=@quantity,
        manufacturingDate=@manufacturingDate, expiryType=@expiryType, expiryValue=@expiryValue, expiryDate=@expiryDate,
        updatedAt=datetime('now')
      WHERE id=@id AND userId=@userId
    `).run({ id: req.params.id, userId: req.userId, name: name.trim(), category, batchNumber, quantity, manufacturingDate, expiryType, expiryValue, expiryDate });

    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json(serialize(row));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/duplicate', (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ? AND userId = ?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  const info = db.prepare(`
    INSERT INTO products (userId, name, category, batchNumber, quantity, manufacturingDate, expiryType, expiryValue, expiryDate, updatedAt)
    VALUES (@userId, @name, @category, @batchNumber, @quantity, @manufacturingDate, @expiryType, @expiryValue, @expiryDate, datetime('now'))
  `).run({ ...existing, name: `${existing.name} (Copy)` });
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(serialize(row));
});

router.post('/:id/archive', (req, res) => {
  const info = db
    .prepare(`UPDATE products SET archived = 1, updatedAt = datetime('now') WHERE id = ? AND userId = ?`)
    .run(req.params.id, req.userId);
  if (info.changes === 0) return res.status(404).json({ error: 'Product not found' });
  res.json(serialize(db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)));
});

router.post('/:id/restore', (req, res) => {
  const info = db
    .prepare(`UPDATE products SET archived = 0, updatedAt = datetime('now') WHERE id = ? AND userId = ?`)
    .run(req.params.id, req.userId);
  if (info.changes === 0) return res.status(404).json({ error: 'Product not found' });
  res.json(serialize(db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)));
});

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM products WHERE id = ? AND userId = ?').run(req.params.id, req.userId);
  if (info.changes === 0) return res.status(404).json({ error: 'Product not found' });
  res.status(204).end();
});

export default router;
