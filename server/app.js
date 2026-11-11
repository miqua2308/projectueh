import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiRouter } from './routes/api.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { CategoryRepository } from './repositories/category.repository.js';
import { TransactionRepository } from './repositories/transaction.repository.js';
import { BudgetRepository } from './repositories/budget.repository.js';
import { BudgetAlertService } from './services/budgetAlert.service.js';
import { RuleBasedAdvisor } from './services/ruleBasedAdvisor.service.js';
import { AnalyticsService } from './services/analytics.service.js';
import { AiAdvisorService } from './services/aiAdvisor.service.js';
import { GeminiClient } from './services/geminiClient.js';
import { CategoriesController } from './controllers/categories.controller.js';
import { TransactionsController } from './controllers/transactions.controller.js';
import { BudgetsController } from './controllers/budgets.controller.js';
import { DashboardController } from './controllers/dashboard.controller.js';
import { AiController } from './controllers/ai.controller.js';

export function createApp(db) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const container = buildContainer(db);
  const apiRouter = createApiRouter(container);

  app.get('/healthz', (req, res) => res.json({ ok: true }));
  app.use('/api/v1', apiRouter);
  serveClientBuild(app);
  app.use(errorHandler);

  return app;
}

/** Production: phục vụ bản build Vite (dist/) + fallback SPA về index.html. */
function serveClientBuild(app) {
  const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
  const indexHtml = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexHtml)) return;
  app.use(express.static(distDir, { index: false, maxAge: '7d', immutable: true }));
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.sendFile(indexHtml);
  });
}

function buildContainer(db) {
  const catRepo = new CategoryRepository(db);
  const txRepo = new TransactionRepository(db);
  const budgetRepo = new BudgetRepository(db);

  const alertService = new BudgetAlertService(budgetRepo, txRepo);
  const ruleAdvisor = new RuleBasedAdvisor();
  const analyticsService = new AnalyticsService(txRepo, catRepo, budgetRepo);
  const aiService = new AiAdvisorService(analyticsService, ruleAdvisor, GeminiClient.fromEnv());

  return {
    categoriesController: new CategoriesController(catRepo),
    transactionsController: new TransactionsController(txRepo, alertService, analyticsService),
    budgetsController: new BudgetsController(budgetRepo, txRepo),
    dashboardController: new DashboardController(analyticsService),
    aiController: new AiController(aiService)
  };
}
