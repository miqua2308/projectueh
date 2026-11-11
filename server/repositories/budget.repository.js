/**
 * Budget Repository: Tương tác bảng budgets trong SQLite
 */
export class BudgetRepository {
  constructor(db) {
    this.db = db;
  }

  upsert({ category_id, month, amount }) {
    const stmt = this.db.prepare(`
      INSERT INTO budgets (category_id, month, amount)
      VALUES (?, ?, ?)
      ON CONFLICT(category_id, month) DO UPDATE SET amount = excluded.amount
    `);
    stmt.run(category_id, month, amount);
    return this.findByCategoryAndMonth(category_id, month);
  }

  delete(id) {
    const res = this.db.prepare('DELETE FROM budgets WHERE id = ?').run(id);
    return Number(res.changes) > 0;
  }

  findByCategoryAndMonth(categoryId, month) {
    return this.db.prepare(`
      SELECT b.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.category_id = ? AND b.month = ?
    `).get(categoryId, month);
  }

  findAllByMonth(month) {
    return this.db.prepare(`
      SELECT b.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.month = ?
      ORDER BY b.amount DESC
    `).all(month);
  }
}
