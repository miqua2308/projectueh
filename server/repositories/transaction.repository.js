/**
 * Transaction Repository: Tương tác bảng transactions trong SQLite
 */
export class TransactionRepository {
  constructor(db) {
    this.db = db;
  }

  create({ category_id, type, amount, date, note }) {
    const stmt = this.db.prepare(`
      INSERT INTO transactions (category_id, type, amount, date, note)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(category_id, type, amount, date, note || null);
    return this.findById(Number(info.lastInsertRowid));
  }

  update(id, fields) {
    const sets = [];
    const values = [];
    for (const [key, val] of Object.entries(fields)) {
      sets.push(`${key} = ?`);
      values.push(val);
    }
    values.push(id);
    this.db.prepare(`UPDATE transactions SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  }

  delete(id) {
    const res = this.db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
    return Number(res.changes) > 0;
  }

  findById(id) {
    return this.db.prepare(`
      SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `).get(id);
  }

  findSortedByDateAsc(month = null) {
    let sql = `
      SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
    `;
    const params = [];
    if (month) {
      sql += " WHERE strftime('%Y-%m', t.date) = ?";
      params.push(month);
    }
    sql += ' ORDER BY t.date ASC, t.id ASC';
    return this.db.prepare(sql).all(...params);
  }

  getSpentByCategoryAndMonth(categoryId, month) {
    const row = this.db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE category_id = ? AND type = 'EXPENSE' AND strftime('%Y-%m', date) = ?
    `).get(categoryId, month);
    return row ? Number(row.total) : 0;
  }
}
