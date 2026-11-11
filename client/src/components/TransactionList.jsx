import React, { useState } from 'react';
import { formatVND, formatDate } from '../utils/formatters.js';

function FilterBar({ categories, onFilter, onReset }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [type, setType] = useState('');

  const handleApply = () => onFilter({ startDate, endDate, categoryId, type });
  const handleReset = () => {
    setStartDate(''); setEndDate(''); setCategoryId(''); setType('');
    onReset();
  };

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <span className="filter-label">Từ ngày</span>
        <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </div>
      <div className="filter-group">
        <span className="filter-label">Đến ngày</span>
        <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      <div className="filter-group">
        <span className="filter-label">Danh mục</span>
        <select className="form-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
      </div>
      <div className="filter-group">
        <span className="filter-label">Phân loại</span>
        <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Tất cả (Thu & Chi)</option>
          <option value="EXPENSE">Khoản Chi (-)</option>
          <option value="INCOME">Khoản Thu (+)</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={handleApply}>Lọc</button>
        <button className="btn btn-secondary" onClick={handleReset}>Đặt lại</button>
      </div>
    </div>
  );
}

function TableRow({ tx, onDelete }) {
  const isExp = tx.type === 'EXPENSE';
  return (
    <tr>
      <td data-label="Ngày" className="num-tabular" style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>{formatDate(tx.date)}</td>
      <td data-label="Danh mục">
        <span className="badge-tag" style={{
          background: isExp ? 'var(--color-expense-soft)' : 'var(--color-income-soft)',
          color: isExp ? 'var(--color-expense)' : 'var(--color-income)',
          border: `1px solid ${isExp ? 'rgba(225, 29, 72, 0.15)' : 'rgba(5, 150, 105, 0.15)'}`
        }}>
          {tx.category_name}
        </span>
      </td>
      <td data-label="Ghi chú" style={{ color: tx.note ? 'var(--text-body)' : 'var(--text-muted)' }}>{tx.note || '—'}</td>
      <td data-label="Số tiền" className="num-tabular" style={{ textAlign: 'right', fontWeight: 600, color: isExp ? 'var(--color-expense)' : 'var(--color-income)' }}>
        {isExp ? '-' : '+'}{formatVND(tx.amount)}
      </td>
      <td data-label="" className="cell-actions" style={{ textAlign: 'center' }}>
        <button className="btn-ghost-danger" onClick={() => onDelete(tx.id)}>Xóa</button>
      </td>
    </tr>
  );
}

function TransactionTable({ transactions, onDelete }) {
  return (
    <div className="table-container">
      <table className="custom-table responsive-table">
        <thead>
          <tr>
            <th>Ngày</th>
            <th>Danh Mục</th>
            <th>Ghi Chú</th>
            <th style={{ textAlign: 'right' }}>Số Tiền (VND)</th>
            <th style={{ textAlign: 'center' }}>Thao Tác</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                Không tìm thấy giao dịch nào trong khoảng thời gian đã chọn.
              </td>
            </tr>
          ) : (
            transactions.map((tx) => <TableRow key={tx.id} tx={tx} onDelete={onDelete} />)
          )}
        </tbody>
      </table>
    </div>
  );
}

export function TransactionList({ transactions, categories, onFilterChange, onDelete, onOpenAddModal }) {
  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Sổ Cái Giao Dịch</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lọc khoảng ngày (Binary Search), danh mục và phân loại thu/chi</span>
        </div>
        <button className="btn" onClick={onOpenAddModal}>+ Ghi Nhận Giao Dịch</button>
      </div>
      <FilterBar categories={categories} onFilter={onFilterChange} onReset={() => onFilterChange({})} />
      <TransactionTable transactions={transactions} onDelete={onDelete} />
    </div>
  );
}
