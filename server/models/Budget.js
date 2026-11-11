/**
 * Domain Entity: Budget (Hạn mức ngân sách)
 * Quản lý hạn mức chi tiêu theo tháng và tính toán tỷ lệ tiêu thụ
 */
export class Budget {
  constructor({ id = null, category_id, month, amount }) {
    this.id = id;
    this.categoryId = Number(category_id);
    this.month = month;
    this.amount = Number(amount);
    this.validate();
  }

  validate() {
    if (!this.categoryId || this.categoryId <= 0) {
      throw new Error('Mã danh mục không hợp lệ');
    }
    if (!/^\d{4}-\d{2}$/.test(this.month)) {
      throw new Error('Tháng phải theo định dạng YYYY-MM');
    }
    if (isNaN(this.amount) || this.amount <= 0) {
      throw new Error('Hạn mức ngân sách phải lớn hơn 0');
    }
  }

  calculateUsage(spentAmount) {
    const spent = Number(spentAmount) || 0;
    const percentage = Number(((spent / this.amount) * 100).toFixed(1));
    const remaining = Math.max(0, this.amount - spent);
    const isExceeded = spent >= this.amount;
    const isWarning = percentage >= 80 && !isExceeded;

    return {
      spent,
      remaining,
      percentage,
      isWarning,
      isExceeded
    };
  }
}
