/**
 * Domain Entity: Transaction (Giao dịch thu/chi)
 * Đảm nhiệm tính đúng đắn và bất biến của thực thể giao dịch
 */
export class Transaction {
  constructor({ id = null, category_id, type, amount, date, note = '' }) {
    this.id = id;
    this.categoryId = Number(category_id);
    this.type = type;
    this.amount = Number(amount);
    this.date = date;
    this.note = note ? String(note).trim() : '';
    this.validate();
  }

  validate() {
    if (!['INCOME', 'EXPENSE'].includes(this.type)) {
      throw new Error("Loại giao dịch phải là 'INCOME' hoặc 'EXPENSE'");
    }
    if (isNaN(this.amount) || this.amount <= 0) {
      throw new Error('Số tiền giao dịch phải lớn hơn 0');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(this.date)) {
      throw new Error('Ngày giao dịch phải theo định dạng YYYY-MM-DD');
    }
    if (!this.categoryId || this.categoryId <= 0) {
      throw new Error('Mã danh mục không hợp lệ');
    }
  }

  isExpense() {
    return this.type === 'EXPENSE';
  }

  isIncome() {
    return this.type === 'INCOME';
  }
}
