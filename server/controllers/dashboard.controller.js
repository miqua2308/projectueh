export class DashboardController {
  constructor(analyticsService) {
    this.analytics = analyticsService;
  }

  getSummary = (req, res, next) => {
    try {
      const month = req.query.month || new Date().toISOString().substring(0, 7);
      const summary = this.analytics.getSummary(month);
      res.json({ success: true, data: summary });
    } catch (err) {
      next(err);
    }
  };

  getCategoryBreakdown = (req, res, next) => {
    try {
      const month = req.query.month || new Date().toISOString().substring(0, 7);
      const type = req.query.type || 'EXPENSE';
      const breakdown = this.analytics.getCategoryBreakdown(month, type);
      res.json({ success: true, data: breakdown });
    } catch (err) {
      next(err);
    }
  };

  getMonthlyTrend = (req, res, next) => {
    try {
      const months = req.query.months ? Number(req.query.months) : 6;
      const trend = this.analytics.getMonthlyTrend(months);
      res.json({ success: true, data: trend });
    } catch (err) {
      next(err);
    }
  };
}
