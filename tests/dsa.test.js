import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MinHeap, getTopKExpenses } from '../server/dsa/MinHeap.js';
import { filterByDateRange } from '../server/dsa/binarySearch.js';
import { aggregateByCategory } from '../server/dsa/categoryAggregator.js';

describe('DSA 1: MinHeap & Top-K Expenses', () => {
  it('should maintain min element at root', () => {
    const heap = new MinHeap((a, b) => a - b);
    heap.push(50);
    heap.push(20);
    heap.push(30);
    assert.equal(heap.peek(), 20);
    assert.equal(heap.pop(), 20);
    assert.equal(heap.peek(), 30);
  });

  it('should return top-3 largest expenses in descending order', () => {
    const expenses = [
      { id: 1, type: 'EXPENSE', amount: 100 },
      { id: 2, type: 'EXPENSE', amount: 500 },
      { id: 3, type: 'INCOME', amount: 1000 },
      { id: 4, type: 'EXPENSE', amount: 300 },
      { id: 5, type: 'EXPENSE', amount: 700 },
      { id: 6, type: 'EXPENSE', amount: 200 }
    ];
    const top3 = getTopKExpenses(expenses, 3);
    assert.equal(top3.length, 3);
    assert.equal(top3[0].amount, 700);
    assert.equal(top3[1].amount, 500);
    assert.equal(top3[2].amount, 300);
  });
});

describe('DSA 2: Binary Search Date Range Filtering', () => {
  const sorted = [
    { id: 1, date: '2026-10-01', amount: 10 },
    { id: 2, date: '2026-10-05', amount: 20 },
    { id: 3, date: '2026-10-10', amount: 30 },
    { id: 4, date: '2026-10-15', amount: 40 },
    { id: 5, date: '2026-10-20', amount: 50 }
  ];

  it('should filter items strictly within date range', () => {
    const result = filterByDateRange(sorted, '2026-10-05', '2026-10-15');
    assert.equal(result.length, 3);
    assert.equal(result[0].date, '2026-10-05');
    assert.equal(result[2].date, '2026-10-15');
  });

  it('should return empty array when range has no matches', () => {
    const result = filterByDateRange(sorted, '2026-10-06', '2026-10-09');
    assert.equal(result.length, 0);
  });
});

describe('DSA 3: Map Category Aggregation', () => {
  it('should group transactions by category and calculate sum', () => {
    const transactions = [
      { category_id: 1, amount: 200 },
      { category_id: 2, amount: 300 },
      { category_id: 1, amount: 500 }
    ];
    const catMap = new Map([
      [1, { name: 'Ăn uống', color: '#F00' }],
      [2, { name: 'Đi lại', color: '#0F0' }]
    ]);

    const result = aggregateByCategory(transactions, catMap);
    assert.equal(result.length, 2);
    assert.equal(result[0].categoryId, 1);
    assert.equal(result[0].total, 700);
    assert.equal(result[0].percentage, 70);
    assert.equal(result[1].categoryId, 2);
    assert.equal(result[1].total, 300);
    assert.equal(result[1].percentage, 30);
  });
});
