import React from 'react';
import { formatVND } from '../utils/formatters.js';

function BudgetStatusBadge({ status, percentage }) {
  if (status === 'EXCEEDED_100') {
    return (
      <span className="badge-tag" style={{ background: 'var(--color-expense-soft)', color: 'var(--color-expense)', border: '1px solid rgba(225, 29, 72, 0.2)' }}>
        🚨 VƯỢT HẠN MỨC
      </span>
    );
  }
  if (status === 'WARNING_80') {
    return (
      <span className="badge-tag" style={{ background: 'var(--color-warning-soft)', color: 'var(--color-warning)', border: '1px solid rgba(217, 119, 6, 0.2)' }}>
        ⚠️ ĐẠT {percentage}%
      </span>
    );
  }
  return (
    <span className="badge-tag" style={{ background: 'var(--color-income-soft)', color: 'var(--color-income)', border: '1px solid rgba(5, 150, 105, 0.2)' }}>
      AN TOÀN ({percentage}%)
    </span>
  );
}

function BudgetCard({ item, onDelete }) {
  const barClass = item.status === 'EXCEEDED_100' ? 'exceeded' : item.status === 'WARNING_80' ? 'warning' : 'ok';
  return (
    <div className="budget-card">
      <div>
        <div className="budget-card-header">
          <strong style={{ fontSize: '1rem', color: 'var(--text-headline)' }}>{item.categoryName}</strong>
          <BudgetStatusBadge status={item.status} percentage={item.percentage} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }} className="num-tabular">
          <span style={{ color: 'var(--text-muted)' }}>Đã chi: {formatVND(item.spentAmount)}</span>
          <span style={{ color: 'var(--text-headline)', fontWeight: 600 }}>Hạn mức: {formatVND(item.budgetAmount)}</span>
        </div>
        <div className="progress-track">
          <div className={`progress-bar ${barClass}`} style={{ width: `${Math.min(100, item.percentage)}%` }} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', fontSize: '0.8rem', borderTop: '1px solid var(--border-hairline)', paddingTop: '0.75rem' }}>
        <span className="num-tabular" style={{ color: item.status === 'EXCEEDED_100' ? 'var(--color-expense)' : 'var(--text-muted)' }}>
          {item.status === 'EXCEEDED_100' ? `Vượt: ${formatVND(item.spentAmount - item.budgetAmount)}` : `Khả dụng: ${formatVND(item.remainingAmount)}`}
        </span>
        <button className="btn-ghost-danger" onClick={() => onDelete(item.id)}>Xóa hạn mức</button>
      </div>
    </div>
  );
}

export function BudgetList({ budgets, month, onOpenModal, onDelete }) {
  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Hạn Mức Ngân Sách ({month})</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Giám sát tiêu thụ thực tế và tự động cảnh báo ở ngưỡng 80% & 100%</span>
        </div>
        <button className="btn" onClick={onOpenModal}>+ Thiết Lập Ngân Sách</button>
      </div>
      {budgets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3.5rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-hairline)' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>Chưa có danh mục nào được đặt hạn mức trong tháng {month}.</p>
          <button className="btn" onClick={onOpenModal}>Thiết lập ngân sách ngay</button>
        </div>
      ) : (
        <div className="budget-grid">
          {budgets.map((item) => <BudgetCard key={item.id} item={item} onDelete={onDelete} />)}
        </div>
      )}
    </div>
  );
}
