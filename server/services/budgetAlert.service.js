/**
 * BudgetAlertService: Kiểm tra và phát cảnh báo ngân sách khi thêm khoản chi
 * Tuân thủ Single Responsibility Principle & Dependency Injection
 */
export class BudgetAlertService {
  constructor(budgetRepository, transactionRepository) {
    this.budgetRepo = budgetRepository;
    this.txRepo = transactionRepository;
  }

  checkAlert(categoryId, month, newExpenseAmount) {
    const budget = this.budgetRepo.findByCategoryAndMonth(categoryId, month);
    if (!budget) {
      return { triggered: false, level: 'NONE', percentage: 0 };
    }

    const currentSpent = this.txRepo.getSpentByCategoryAndMonth(categoryId, month);
    const totalSpent = currentSpent + Number(newExpenseAmount);
    const percentage = Number(((totalSpent / budget.amount) * 100).toFixed(1));
    const level = this.evaluateLevel(percentage);

    return {
      triggered: level !== 'NONE',
      level,
      percentage,
      categoryName: budget.category_name,
      budgetAmount: budget.amount,
      spentAmount: totalSpent,
      remainingAmount: Math.max(0, budget.amount - totalSpent),
      message: this.formatAlertMessage(level, budget.category_name, percentage)
    };
  }

  evaluateLevel(percentage) {
    if (percentage >= 100) return 'EXCEEDED_100';
    if (percentage >= 80) return 'WARNING_80';
    return 'NONE';
  }

  formatAlertMessage(level, categoryName, percentage) {
    if (level === 'EXCEEDED_100') {
      return `BÁO ĐỘNG: Danh mục '${categoryName}' đã vượt ngân sách (đạt ${percentage}%)!`;
    }
    if (level === 'WARNING_80') {
      return `CẢNH BÁO: Danh mục '${categoryName}' đã chạm ${percentage}% ngân sách tháng!`;
    }
    return '';
  }
}
