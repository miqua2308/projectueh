import { aggregateByCategory } from '../dsa/categoryAggregator.js';
import { getTopKExpenses } from '../dsa/MinHeap.js';

export class AnalyticsService {
  constructor(transactionRepo, categoryRepo, budgetRepo) {
    this.txRepo = transactionRepo;
    this.catRepo = categoryRepo;
    this.budgetRepo = budgetRepo;
  }

  getSummary(month) {
    const list = this.txRepo.findSortedByDateAsc(month);
    let totalIncome = 0;
    let totalExpense = 0;

    for (const tx of list) {
      if (tx.type === 'INCOME') totalIncome += tx.amount;
      if (tx.type === 'EXPENSE') totalExpense += tx.amount;
    }

    const netBalance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Number(((netBalance / totalIncome) * 100).toFixed(1)) : 0;

    return { totalIncome, totalExpense, netBalance, savingsRate };
  }

  getCategoryBreakdown(month, type = 'EXPENSE') {
    const list = this.txRepo.findSortedByDateAsc(month).filter((tx) => tx.type === type);
    const categoryMap = this.catRepo.findMap();
    return aggregateByCategory(list, categoryMap);
  }

  getTopExpenses(month, k = 5) {
    const list = this.txRepo.findSortedByDateAsc(month);
    return getTopKExpenses(list, k);
  }

  getAggregatedDataForAi(month) {
    const summary = this.getSummary(month);
    const budgets = this.budgetRepo.findAllByMonth(month);
    const categoryBudgets = [];

    for (const b of budgets) {
      const spent = this.txRepo.getSpentByCategoryAndMonth(b.category_id, month);
      const percentage = b.amount > 0 ? Number(((spent / b.amount) * 100).toFixed(1)) : 0;
      categoryBudgets.push({
        category: b.category_name,
        budget: b.amount,
        spent,
        percentage
      });
    }

    const [year, m] = month.split('-').map(Number);
    const daysInMonth = new Date(year, m, 0).getDate();
    const currentDay = Math.min(new Date().getDate(), daysInMonth);
    const daysRemainingInMonth = Math.max(1, daysInMonth - currentDay);

    return {
      month,
      daysRemainingInMonth,
      totalIncome: summary.totalIncome,
      totalExpense: summary.totalExpense,
      savingsRate: summary.savingsRate,
      categoryBudgets
    };
  }

  getMonthlyTrend(monthsCount = 6) {
    const result = [];
    const now = new Date();

    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const summary = this.getSummary(mStr);
      result.push({
        month: mStr,
        income: summary.totalIncome,
        expense: summary.totalExpense,
        balance: summary.netBalance
      });
    }
    return result;
  }
}
