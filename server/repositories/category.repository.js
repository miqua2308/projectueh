/**
 * Category Repository: Tương tác bảng categories trong SQLite
 */
export class CategoryRepository {
  constructor(db) {
    this.db = db;
  }

  findAll() {
    return this.db.prepare('SELECT * FROM categories ORDER BY type DESC, name ASC').all();
  }

  findById(id) {
    return this.db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  }

  findMap() {
    const list = this.findAll();
    const map = new Map();
    for (const item of list) {
      map.set(item.id, item);
    }
    return map;
  }
}
