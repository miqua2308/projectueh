import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AiAdvisorService } from '../server/services/aiAdvisor.service.js';
import { GeminiClient } from '../server/services/geminiClient.js';
import { RuleBasedAdvisor } from '../server/services/ruleBasedAdvisor.service.js';

const AGG = {
  month: '2026-10',
  daysRemainingInMonth: 9,
  totalIncome: 25000000,
  totalExpense: 16400000,
  savingsRate: 34.4,
  categoryBudgets: [{ category: 'Ăn uống', budget: 2000000, spent: 1700000, percentage: 85 }]
};
const analytics = { getAggregatedDataForAi: () => AGG };

function geminiReply(obj, status = 200) {
  return async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] } }] })
  });
}

const VALID = {
  summary: 'Chi tiêu tháng 10 chiếm 65% thu nhập, Ăn uống sắp chạm hạn mức.',
  suggestions: [{ id: 1, category: 'Ăn uống', type: 'WARNING', targetAmount: 300000, savingPotential: 0, message: 'Giới hạn 33.000 ₫/ngày trong 9 ngày còn lại.' }]
};

describe('AiAdvisorService + GeminiClient', () => {
  it('trả kết quả Gemini khi phản hồi hợp lệ', async () => {
    const client = new GeminiClient({ apiKey: 'k', models: ['m1'], fetchImpl: geminiReply(VALID) });
    const res = await new AiAdvisorService(analytics, new RuleBasedAdvisor(), client).getSuggestions('2026-10');
    assert.equal(res.engine, 'GEMINI_FLASH');
    assert.equal(res.suggestions.length, 1);
  });

  it('fallback sang quy tắc khi chưa có API key', async () => {
    const client = new GeminiClient({ apiKey: '', fetchImpl: geminiReply(VALID) });
    const res = await new AiAdvisorService(analytics, new RuleBasedAdvisor(), client).getSuggestions('2026-10');
    assert.equal(res.engine, 'RULE_BASED_FALLBACK');
    assert.ok(res.suggestions.length > 0);
  });

  it('fallback khi JSON sai schema (Zod)', async () => {
    const client = new GeminiClient({ apiKey: 'k', models: ['m1'], fetchImpl: geminiReply({ summary: 'x' }) });
    const res = await new AiAdvisorService(analytics, new RuleBasedAdvisor(), client).getSuggestions('2026-10');
    assert.equal(res.engine, 'RULE_BASED_FALLBACK');
  });

  it('không thử lại khi gặp 429, thử model dự phòng khi 503', async () => {
    let calls = 0;
    const rateLimited = new GeminiClient({ apiKey: 'k', models: ['a', 'b'], fetchImpl: async () => { calls++; return { ok: false, status: 429 }; } });
    await assert.rejects(rateLimited.generateJson({ systemInstruction: '', prompt: '', responseSchema: {} }));
    assert.equal(calls, 1);

    const seen = [];
    const flaky = new GeminiClient({
      apiKey: 'k',
      models: ['a', 'b'],
      fetchImpl: async (url) => {
        seen.push(url);
        return url.includes('/a:') ? { ok: false, status: 503 } : geminiReply(VALID)();
      }
    });
    const out = await flaky.generateJson({ systemInstruction: '', prompt: '', responseSchema: {} });
    assert.equal(out.model, 'b');
    assert.equal(seen.length, 2);
  });

  it('hủy request khi quá timeout', async () => {
    const slow = new GeminiClient({
      apiKey: 'k',
      models: ['a'],
      timeoutMs: 300,
      fetchImpl: (url, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => {
        const e = new Error('aborted'); e.name = 'AbortError'; reject(e);
      }))
    });
    const started = Date.now();
    await assert.rejects(slow.generateJson({ systemInstruction: '', prompt: '', responseSchema: {} }));
    assert.ok(Date.now() - started < 1000);
  });
});
