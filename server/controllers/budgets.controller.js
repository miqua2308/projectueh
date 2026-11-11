export class BudgetsController {
  constructor(budgetRepo, txRepo) {
    this.budgetRepo = budgetRepo;
    this.txRepo = txRepo;
  }

  getByMonth = (req, res, next) => {
    try {
      const month = req.query.month || new Date().toISOString().substring(0, 7);
      const budgets = this.budgetRepo.findAllByMonth(month);

      const data = budgets.map((b) => {
        const spent = this.txRepo.getSpentByCategoryAndMonth(b.category_id, month);
        const percentage = b.amount > 0 ? Number(((spent / b.amount) * 100).toFixed(1)) : 0;
        let status = 'OK';
        if (percentage >= 100) status = 'EXCEEDED_100';
        else if (percentage >= 80) status = 'WARNING_80';

        return {
          id: b.id,
          categoryId: b.category_id,
          categoryName: b.category_name,
          categoryColor: b.category_color,
          categoryIcon: b.category_icon,
          month: b.month,
          budgetAmount: b.amount,
          spentAmount: spent,
          remainingAmount: Math.max(0, b.amount - spent),
          percentage,
          status
        };
      });

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  setBudget = (req, res, next) => {
    try {
      const saved = this.budgetRepo.upsert(req.validatedBody);
      res.status(201).json({ success: true, data: saved });
    } catch (err) {
      next(err);
    }
  };

  delete = (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const ok = this.budgetRepo.delete(id);
      if (!ok) {
        return res.status(404).json({ success: false, error: { message: 'Không tìm thấy ngân sách' } });
      }
      res.json({ success: true, data: { deletedId: id } });
    } catch (err) {
      next(err);
    }
  };
}
