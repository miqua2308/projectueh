import { z } from 'zod';

export const setBudgetSchema = z.object({
  category_id: z.number({ required_error: 'Vui lòng chọn danh mục' }).int().positive(),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Tháng phải theo định dạng YYYY-MM'),
  amount: z.number({ required_error: 'Vui lòng nhập hạn mức' }).positive('Hạn mức ngân sách phải lớn hơn 0')
});

export function validateSetBudget(req, res, next) {
  const result = setBudgetSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dữ liệu ngân sách không hợp lệ',
        details: result.error.errors.map((e) => e.message)
      }
    });
  }
  req.validatedBody = result.data;
  next();
}
