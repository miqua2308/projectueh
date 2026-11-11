import { z } from 'zod';

export const SYSTEM_INSTRUCTION = `Bạn là chuyên gia tư vấn tài chính cá nhân thông minh và thực tế cho người Việt Nam (đơn vị tiền tệ: VND).
Nhiệm vụ: Phân tích bảng tổng hợp ngân sách tháng và đưa ra TỐI ĐA 5 gợi ý chi tiêu cụ thể, hành động được ngay.
Yêu cầu bắt buộc:
1. Mỗi gợi ý PHẢI có con số cụ thể (số tiền cắt giảm, số tiền chi tối đa mỗi ngày, hoặc mục tiêu tiết kiệm).
2. Lời khuyên ngắn gọn, súc tích (1-2 câu mỗi gợi ý, dưới 180 ký tự).
3. Viết tiếng Việt CÓ DẤU đầy đủ, tự nhiên.
4. Luôn trả về định dạng JSON thuần túy theo schema được chỉ định, không thêm markdown formatting hay văn bản ngoài JSON.`;

export const AiSuggestionOutputSchema = z.object({
  summary: z.string().min(10).max(200),
  suggestions: z.array(
    z.object({
      id: z.number(),
      category: z.string(),
      type: z.enum(['WARNING', 'SAVING', 'OPTIMIZATION']),
      targetAmount: z.number(),
      savingPotential: z.number(),
      message: z.string().min(10).max(180)
    })
  ).max(5)
});

// Schema dạng OpenAPI để Gemini trả JSON đúng cấu trúc
const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING' },
    suggestions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'INTEGER' },
          category: { type: 'STRING' },
          type: { type: 'STRING', enum: ['WARNING', 'SAVING', 'OPTIMIZATION'] },
          targetAmount: { type: 'NUMBER' },
          savingPotential: { type: 'NUMBER' },
          message: { type: 'STRING' }
        },
        required: ['id', 'category', 'type', 'targetAmount', 'savingPotential', 'message']
      }
    }
  },
  required: ['summary', 'suggestions']
};

export class AiAdvisorService {
  constructor(analyticsService, ruleBasedAdvisor, geminiClient = null) {
    this.analytics = analyticsService;
    this.fallbackAdvisor = ruleBasedAdvisor;
    this.gemini = geminiClient;
  }

  async getSuggestions(month) {
    // Chỉ gửi dữ liệu đã tổng hợp theo danh mục (không gửi giao dịch thô)
    const aggregated = this.analytics.getAggregatedDataForAi(month);

    if (this.gemini?.isConfigured()) {
      try {
        return await this._fromGemini(month, aggregated);
      } catch (err) {
        console.warn('[AI] Gemini lỗi, chuyển sang Rule-Based:', err.message);
        return this._fromRules(month, aggregated, err.message);
      }
    }
    return this._fromRules(month, aggregated, 'Chưa cấu hình GEMINI_API_KEY');
  }

  async _fromGemini(month, aggregated) {
    const { model, data } = await this.gemini.generateJson({
      systemInstruction: SYSTEM_INSTRUCTION,
      prompt: `Bảng tổng hợp tài chính tháng ${month} (JSON):\n${JSON.stringify(aggregated)}`,
      responseSchema: RESPONSE_SCHEMA
    });
    const parsed = AiSuggestionOutputSchema.parse(this._clamp(data));
    return {
      month,
      engine: 'GEMINI_FLASH',
      model,
      botSleeping: false,
      summary: parsed.summary,
      suggestions: parsed.suggestions
    };
  }

  // Cắt bớt độ dài để không loại bỏ cả câu trả lời chỉ vì vượt vài ký tự
  _clamp(data) {
    if (!data || typeof data !== 'object') return data;
    const cut = (s, n) => (typeof s === 'string' && s.length > n ? `${s.slice(0, n - 1)}…` : s);
    return {
      summary: cut(data.summary, 200),
      suggestions: Array.isArray(data.suggestions)
        ? data.suggestions.slice(0, 5).map((s, i) => ({ ...s, id: Number(s.id) || i + 1, message: cut(s.message, 180) }))
        : data.suggestions
    };
  }

  _fromRules(month, aggregated, reason) {
    const suggestions = this.fallbackAdvisor.generateSuggestions(aggregated);
    const summary = suggestions.length > 0
      ? `Đã tạo ${suggestions.length} gợi ý tài chính tháng ${month} dựa trên bộ quy tắc định lượng.`
      : `Tài chính tháng ${month} của bạn đang ở trạng thái cân bằng an toàn.`;
    return {
      month,
      engine: 'RULE_BASED_FALLBACK',
      botSleeping: true,
      fallbackReason: reason,
      summary,
      suggestions
    };
  }
}
