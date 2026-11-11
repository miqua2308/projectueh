/**
 * GeminiClient: gọi Google Gemini qua REST (không cần SDK).
 * - Timeout cứng theo SPEC (mặc định 5000ms) bằng AbortController.
 * - Thử lại tối đa 1 lần (với model dự phòng) khi lỗi mạng / 5xx / 404 model / lần đầu quá 60% ngân sách.
 * - Không thử lại khi lỗi xác thực (400/401/403) hoặc 429.
 */
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];
const FIRST_ATTEMPT_SHARE = 0.6; // lần đầu dùng tối đa 60% ngân sách, phần còn lại cho lần thử lại

export class GeminiError extends Error {
  constructor(message, { status = 0, retryable = false } = {}) {
    super(message);
    this.name = 'GeminiError';
    this.status = status;
    this.retryable = retryable;
  }
}

export class GeminiClient {
  constructor({ apiKey, models, timeoutMs = 5000, fetchImpl = globalThis.fetch } = {}) {
    this.apiKey = apiKey;
    this.models = models?.length ? models : DEFAULT_MODELS;
    this.timeoutMs = timeoutMs;
    this.fetch = fetchImpl;
  }

  static fromEnv(env = process.env) {
    const models = (env.GEMINI_MODEL || '').split(',').map((m) => m.trim()).filter(Boolean);
    return new GeminiClient({
      apiKey: (env.GEMINI_API_KEY || '').trim(),
      models,
      timeoutMs: Number(env.GEMINI_TIMEOUT_MS) || 5000
    });
  }

  isConfigured() {
    return Boolean(this.apiKey) && !this.apiKey.startsWith('your_');
  }

  async generateJson({ systemInstruction, prompt, responseSchema }) {
    if (!this.isConfigured()) throw new GeminiError('GEMINI_API_KEY chưa được cấu hình');
    const deadline = Date.now() + this.timeoutMs;
    const attempts = this.models.slice(0, 2); // 1 lần gọi + tối đa 1 lần thử lại
    let lastError;

    for (const [i, model] of attempts.entries()) {
      const remaining = deadline - Date.now();
      if (remaining <= 200) break;
      const isLast = i === attempts.length - 1;
      const budget = isLast ? remaining : Math.round(this.timeoutMs * FIRST_ATTEMPT_SHARE);
      try {
        const text = await this._call(model, { systemInstruction, prompt, responseSchema }, budget, !isLast);
        return { model, data: JSON.parse(text) };
      } catch (err) {
        lastError = err;
        if (!(err instanceof GeminiError) || !err.retryable) throw err;
      }
    }
    throw lastError || new GeminiError('Gemini hết thời gian chờ', { retryable: true });
  }

  async _call(model, { systemInstruction, prompt, responseSchema }, timeoutMs, canRetry = false) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await this.fetch(`${API_BASE}/${model}:generateContent`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', responseSchema, temperature: 0.4 }
        })
      });
      if (!res.ok) throw this._httpError(res.status, model);
      const body = await res.json();
      const text = body?.candidates?.[0]?.content?.parts?.filter((p) => !p.thought).map((p) => p.text || '').join('');
      if (!text) throw new GeminiError('Gemini trả về nội dung rỗng', { retryable: true });
      return text;
    } catch (err) {
      if (err instanceof GeminiError) throw err;
      const isAbort = err?.name === 'AbortError';
      // Quá hạn ở lần đầu -> vẫn còn ngân sách cho model dự phòng
      throw new GeminiError(isAbort ? `Gemini (${model}) quá thời gian ${timeoutMs}ms` : `Lỗi mạng: ${err.message}`, {
        retryable: !isAbort || canRetry
      });
    } finally {
      clearTimeout(timer);
    }
  }

  _httpError(status, model) {
    const retryable = status >= 500 || status === 404;
    return new GeminiError(`Gemini (${model}) trả mã ${status}`, { status, retryable });
  }
}
