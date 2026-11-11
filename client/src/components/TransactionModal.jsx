import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getToday } from '../utils/formatters.js';

function TypeSelector({ type, onTypeChange }) {
  return (
    <div className="form-group">
      <label>Phân Loại Giao Dịch</label>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="button"
          className={`btn ${type === 'EXPENSE' ? 'btn-danger' : 'btn-secondary'}`}
          style={{ flex: 1 }}
          onClick={() => onTypeChange('EXPENSE')}
        >
          Khoản Chi (-)
        </button>
        <button
          type="button"
          className={`btn ${type === 'INCOME' ? '' : 'btn-secondary'}`}
          style={{ flex: 1 }}
          onClick={() => onTypeChange('INCOME')}
        >
          Khoản Thu (+)
        </button>
      </div>
    </div>
  );
}

function CategorySelect({ categories, categoryId, onChange }) {
  return (
    <div className="form-group">
      <label>Danh Mục Phân Bổ</label>
      <select className="form-select" style={{ width: '100%' }} value={categoryId} onChange={(e) => onChange(e.target.value)} required>
        <option value="">-- Chọn danh mục --</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  );
}

function ModalForm({ categories, type, onTypeChange, categoryId, setCategoryId, amount, setAmount, date, setDate, note, setNote, onSubmit, onClose }) {
  return (
    <form onSubmit={onSubmit}>
      <TypeSelector type={type} onTypeChange={onTypeChange} />
      <CategorySelect categories={categories} categoryId={categoryId} onChange={setCategoryId} />
      <div className="form-group">
        <label>Số Tiền (VND)</label>
        <input type="number" className="form-input" style={{ width: '100%' }} placeholder="VD: 150000" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Ngày Phát Sinh</label>
        <input type="date" className="form-input" style={{ width: '100%' }} value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Ghi Chú</label>
        <input type="text" className="form-input" style={{ width: '100%' }} placeholder="VD: Ăn trưa bạn bè" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy Bỏ</button>
        <button type="submit" className="btn">Lưu Giao Dịch</button>
      </div>
    </form>
  );
}

export function TransactionModal({ categories, isOpen, onClose, onSave }) {
  const [type, setType] = useState('EXPENSE');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getToday());
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;
  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!categoryId) return setError('Vui lòng chọn danh mục');
    if (!amount || Number(amount) <= 0) return setError('Số tiền phải lớn hơn 0');
    if (!date) return setError('Vui lòng chọn ngày');
    onSave({ type, category_id: Number(categoryId), amount: Number(amount), date, note });
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="modal-content" initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} transition={{ type: 'spring', damping: 25, stiffness: 350 }}>
          <div className="modal-header">
            <h2 className="modal-title">+ Ghi Nhận Giao Dịch Mới</h2>
            <button className="alert-banner-close" onClick={onClose}>&times;</button>
          </div>
          {error && <div style={{ color: 'var(--color-expense)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</div>}
          <ModalForm categories={filteredCategories} type={type} onTypeChange={(t) => { setType(t); setCategoryId(''); }} categoryId={categoryId} setCategoryId={setCategoryId} amount={amount} setAmount={setAmount} date={date} setDate={setDate} note={note} setNote={setNote} onSubmit={handleSubmit} onClose={onClose} />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
