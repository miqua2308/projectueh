import { z } from 'zod';

export const createTransactionSchema = z.object({
  category_id: z.number({ required_error: 'Vui lòng chọn danh mục' }).int().positive(),
  type: z.enum(['INCOME', 'EXPENSE'], { required_error: 'Loại giao dịch phải là INCOME hoặc EXPENSE' }),
  amount: z.number({ required_error: 'Vui lòng nhập số tiền' }).positive('Số tiền phải lớn hơn 0'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải theo định dạng YYYY-MM-DD'),
  note: z.string().max(255).optional().default('')
});

export const updateTransactionSchema = createTransactionSchema.partial();

export function validateCreateTransaction(req, res, next) {
  const result = createTransactionSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dữ liệu giao dịch không hợp lệ',
        details: result.error.errors.map((e) => e.message)
      }
    });
  }
  req.validatedBody = result.data;
  next();
}
