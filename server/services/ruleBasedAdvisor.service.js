/**
 * RuleBasedAdvisor: Động cơ sinh gợi ý tài chính theo quy tắc cố định
 * Kích hoạt khi không có kết nối Gemini hoặc gặp lỗi / timeout
 */
export class RuleBasedAdvisor {
  generateSuggestions(aggregatedData) {
    const {
      daysRemainingInMonth = 10,
      totalIncome = 0,
      totalExpense = 0,
      categoryBudgets = []
    } = aggregatedData;

    const suggestions = [];
    let idCounter = 1;

    this._checkOverBudget(categoryBudgets, suggestions, idCounter);
    this._checkNearBudget(categoryBudgets, daysRemainingInMonth, suggestions);
    this._checkExpenseRatio(totalIncome, totalExpense, suggestions);
    this._checkTopCategory(categoryBudgets, suggestions);

    return suggestions.slice(0, 5);
  }

  _checkOverBudget(categoryBudgets, suggestions) {
    for (const item of categoryBudgets) {
      if (item.spent >= item.budget && item.budget > 0) {
        const overAmount = item.spent - item.budget;
        suggestions.push({
          id: suggestions.length + 1,
          category: item.category,
          type: 'WARNING',
          targetAmount: item.budget,
          savingPotential: overAmount,
          message: `Danh mục '${item.category}' đã vượt ${overAmount.toLocaleString('vi-VN')} ₫ (${item.percentage}%). Hãy tạm dừng chi tiêu danh mục này.`
        });
      }
    }
  }

  _checkNearBudget(categoryBudgets, daysLeft, suggestions) {
    for (const item of categoryBudgets) {
      if (item.percentage >= 80 && item.percentage < 100 && item.budget > 0) {
        const remaining = item.budget - item.spent;
        const dailyCap = Math.max(0, Math.floor(remaining / Math.max(1, daysLeft)));
        suggestions.push({
          id: suggestions.length + 1,
          category: item.category,
          type: 'WARNING',
          targetAmount: remaining,
          savingPotential: 0,
          message: `'${item.category}' đã dùng ${item.percentage}% ngân sách. Giới hạn tối đa ${dailyCap.toLocaleString('vi-VN')} ₫/ngày trong ${daysLeft} ngày còn lại.`
        });
      }
    }
  }

  _checkExpenseRatio(totalIncome, totalExpense, suggestions) {
    if (totalIncome > 0 && totalExpense > totalIncome * 0.7) {
      const gap = Math.round(totalExpense - totalIncome * 0.7);
      suggestions.push({
        id: suggestions.length + 1,
        category: 'Tổng quan tài chính',
        type: 'SAVING',
        targetAmount: Math.round(totalIncome * 0.7),
        savingPotential: gap,
        message: `Tổng chi tiêu chiếm ${((totalExpense / totalIncome) * 100).toFixed(0)}% thu nhập. Hãy giảm ${gap.toLocaleString('vi-VN')} ₫ để đạt mức an toàn 70%.`
      });
    }
  }

  _checkTopCategory(categoryBudgets, suggestions) {
    if (categoryBudgets.length === 0) return;
    const sorted = [...categoryBudgets].sort((a, b) => b.spent - a.spent);
    const top = sorted[0];
    if (top && top.spent > 0) {
      const save10 = Math.round(top.spent * 0.1);
      suggestions.push({
        id: suggestions.length + 1,
        category: top.category,
        type: 'OPTIMIZATION',
        targetAmount: top.spent - save10,
        savingPotential: save10,
        message: `'${top.category}' là khoản chi lớn nhất (${top.spent.toLocaleString('vi-VN')} ₫). Đặt mục tiêu giảm 10% (tiết kiệm ${save10.toLocaleString('vi-VN')} ₫) cho tháng tới.`
      });
    }
  }
}
