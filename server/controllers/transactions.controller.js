import { filterByDateRange } from '../dsa/binarySearch.js';

export class TransactionsController {
  constructor(txRepo, alertService, analyticsService) {
    this.txRepo = txRepo;
    this.alertService = alertService;
    this.analyticsService = analyticsService;
  }

  create = (req, res, next) => {
    try {
      const data = req.validatedBody;
      const created = this.txRepo.create(data);
      let alert = { triggered: false, level: 'NONE', percentage: 0 };

      if (created.type === 'EXPENSE') {
        const month = created.date.substring(0, 7);
        alert = this.alertService.checkAlert(created.category_id, month, created.amount);
      }

      res.status(201).json({
        success: true,
        data: { transaction: created, alert }
      });
    } catch (err) {
      next(err);
    }
  };

  getAll = (req, res, next) => {
    try {
      const { month, startDate, endDate, categoryId, type } = req.query;
      let list = this.txRepo.findSortedByDateAsc(month || null);

      if (startDate || endDate) {
        list = filterByDateRange(list, startDate, endDate);
      }
      if (categoryId) {
        list = list.filter((t) => t.category_id === Number(categoryId));
      }
      if (type) {
        list = list.filter((t) => t.type === type);
      }

      const displayList = list.slice().reverse();
      res.json({ success: true, data: displayList });
    } catch (err) {
      next(err);
    }
  };

  update = (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const updated = this.txRepo.update(id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, error: { message: 'Không tìm thấy giao dịch' } });
      }
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  };

  delete = (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const ok = this.txRepo.delete(id);
      if (!ok) {
        return res.status(404).json({ success: false, error: { message: 'Không tìm thấy giao dịch để xóa' } });
      }
      res.json({ success: true, data: { deletedId: id } });
    } catch (err) {
      next(err);
    }
  };

  getTopExpenses = (req, res, next) => {
    try {
      const { month, limit } = req.query;
      const m = month || new Date().toISOString().substring(0, 7);
      const k = limit ? Number(limit) : 5;
      const topList = this.analyticsService.getTopExpenses(m, k);
      res.json({ success: true, data: topList });
    } catch (err) {
      next(err);
    }
  };
}
