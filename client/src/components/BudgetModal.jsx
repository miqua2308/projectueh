import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

function CategoryField({ categories, categoryId, onChange }) {
  return (
    <div className="form-group">
      <label>Danh Mục Chi Tiêu</label>
      <select className="form-select" style={{ width: '100%' }} value={categoryId} onChange={(e) => onChange(e.target.value)} required>
        <option value="">-- Chọn danh mục --</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  );
}

function AmountField({ amount, onChange }) {
  return (
    <div className="form-group">
      <label>Hạn Mức Ngân Sách (VND)</label>
      <input type="number" className="form-input" style={{ width: '100%' }} placeholder="VD: 3000000" value={amount} onChange={(e) => onChange(e.target.value)} required />
    </div>
  );
}

export function BudgetModal({ categories, month, isOpen, onClose, onSave }) {
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;
  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!categoryId) return setError('Vui lòng chọn danh mục chi tiêu');
    if (!amount || Number(amount) <= 0) return setError('Hạn mức ngân sách phải lớn hơn 0');
    onSave({ category_id: Number(categoryId), month, amount: Number(amount) });
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="modal-content" initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} transition={{ type: 'spring', damping: 25, stiffness: 350 }}>
          <div className="modal-header">
            <h2 className="modal-title">Thiết Lập Ngân Sách ({month})</h2>
            <button className="alert-banner-close" onClick={onClose}>&times;</button>
          </div>
          {error && <div style={{ color: 'var(--color-expense)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <CategoryField categories={expenseCategories} categoryId={categoryId} onChange={setCategoryId} />
            <AmountField amount={amount} onChange={setAmount} />
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy Bỏ</button>
              <button type="submit" className="btn">Lưu Hạn Mức</button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
