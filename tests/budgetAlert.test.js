import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BudgetAlertService } from '../server/services/budgetAlert.service.js';

describe('BudgetAlertService Unit Tests', () => {
  function createMockRepos(budgetAmount, currentSpent) {
    const mockBudgetRepo = {
      findByCategoryAndMonth: (catId, month) => {
        if (budgetAmount === null) return null;
        return { category_id: catId, month, amount: budgetAmount, category_name: 'Ăn uống' };
      }
    };
    const mockTxRepo = {
      getSpentByCategoryAndMonth: () => currentSpent
    };
    return { mockBudgetRepo, mockTxRepo };
  }

  it('should return NONE when total spending is below 80%', () => {
    const { mockBudgetRepo, mockTxRepo } = createMockRepos(2000000, 1000000);
    const service = new BudgetAlertService(mockBudgetRepo, mockTxRepo);

    const result = service.checkAlert(1, '2026-10', 200000);

    assert.equal(result.triggered, false);
    assert.equal(result.level, 'NONE');
    assert.equal(result.percentage, 60);
  });

  it('should return WARNING_80 when spending reaches exactly 80%', () => {
    const { mockBudgetRepo, mockTxRepo } = createMockRepos(2000000, 1400000);
    const service = new BudgetAlertService(mockBudgetRepo, mockTxRepo);

    const result = service.checkAlert(1, '2026-10', 200000);

    assert.equal(result.triggered, true);
    assert.equal(result.level, 'WARNING_80');
    assert.equal(result.percentage, 80);
    assert.match(result.message, /80%/);
  });

  it('should return WARNING_80 when spending is between 80% and 99.9%', () => {
    const { mockBudgetRepo, mockTxRepo } = createMockRepos(2000000, 1500000);
    const service = new BudgetAlertService(mockBudgetRepo, mockTxRepo);

    const result = service.checkAlert(1, '2026-10', 300000);

    assert.equal(result.triggered, true);
    assert.equal(result.level, 'WARNING_80');
    assert.equal(result.percentage, 90);
  });

  it('should return EXCEEDED_100 when spending reaches or exceeds 100%', () => {
    const { mockBudgetRepo, mockTxRepo } = createMockRepos(2000000, 1800000);
    const service = new BudgetAlertService(mockBudgetRepo, mockTxRepo);

    const result = service.checkAlert(1, '2026-10', 400000);

    assert.equal(result.triggered, true);
    assert.equal(result.level, 'EXCEEDED_100');
    assert.equal(result.percentage, 110);
    assert.match(result.message, /BÁO ĐỘNG/);
  });

  it('should return NONE when no budget is defined for category', () => {
    const { mockBudgetRepo, mockTxRepo } = createMockRepos(null, 500000);
    const service = new BudgetAlertService(mockBudgetRepo, mockTxRepo);

    const result = service.checkAlert(999, '2026-10', 100000);

    assert.equal(result.triggered, false);
    assert.equal(result.level, 'NONE');
  });
});
