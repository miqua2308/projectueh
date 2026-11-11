import { Router } from 'express';
import { validateCreateTransaction } from '../validators/transaction.validator.js';
import { validateSetBudget } from '../validators/budget.validator.js';

export function createApiRouter({
  categoriesController,
  transactionsController,
  budgetsController,
  dashboardController,
  aiController
}) {
  const router = Router();

  // Categories
  router.get('/categories', categoriesController.getAll);

  // Transactions
  router.get('/transactions', transactionsController.getAll);
  router.post('/transactions', validateCreateTransaction, transactionsController.create);
  router.put('/transactions/:id', transactionsController.update);
  router.delete('/transactions/:id', transactionsController.delete);
  router.get('/transactions/top-expenses', transactionsController.getTopExpenses);

  // Budgets
  router.get('/budgets', budgetsController.getByMonth);
  router.post('/budgets', validateSetBudget, budgetsController.setBudget);
  router.delete('/budgets/:id', budgetsController.delete);

  // Dashboard
  router.get('/dashboard/summary', dashboardController.getSummary);
  router.get('/dashboard/category-breakdown', dashboardController.getCategoryBreakdown);
  router.get('/dashboard/monthly-trend', dashboardController.getMonthlyTrend);

  // AI Insights
  router.get('/ai/suggestions', aiController.getSuggestions);

  return router;
}
