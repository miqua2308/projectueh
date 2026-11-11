import React, { useState } from 'react';
import { motion } from 'motion/react';
import { formatVND } from '../utils/formatters.js';

const INITIAL_GOALS = [
  { id: 1, name: 'Quỹ Khẩn Cấp (6 Tháng)', current: 45000000, target: 60000000, icon: '🛡️', color: '#0284C7' },
  { id: 2, name: 'Du Lịch Mùa Thu', current: 12500000, target: 15000000, icon: '✈️', color: '#0EA5E9' },
  { id: 3, name: 'Tích Lũy Đầu Tư ETF', current: 35000000, target: 50000000, icon: '📈', color: '#059669' }
];

function GoalCard({ goal }) {
  const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
  return (
    <motion.div
      className="goal-card"
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '1.4rem' }}>{goal.icon}</span>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-title)', fontSize: '0.95rem' }}>{goal.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }} className="num-tabular">
              Đã có {formatVND(goal.current)} / {formatVND(goal.target)}
            </div>
          </div>
        </div>
        <span className="goal-pct-badge num-tabular">{pct}%</span>
      </div>
      <div className="goal-progress-track">
        <motion.div
          className="goal-progress-fill"
          style={{ background: goal.color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}

function NewGoalForm({ onAdd, onCancel }) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!name || !target) return;
    onAdd({ id: Date.now(), name, current: 0, target: Number(target), icon: '🎯', color: '#0284C7' });
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
      <input className="form-input" placeholder="Tên mục tiêu..." value={name} onChange={(e) => setName(e.target.value)} required />
      <input type="number" className="form-input" placeholder="Số tiền cần đạt..." value={target} onChange={(e) => setTarget(e.target.value)} required />
      <button type="submit" className="btn btn-sm">Lưu</button>
      <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>Hủy</button>
    </form>
  );
}

export function SavingsGoals() {
  const [goals, setGoals] = useState(INITIAL_GOALS);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = (newGoal) => {
    setGoals((prev) => [...prev, newGoal]);
    setIsAdding(false);
  };

  return (
    <div className="metric-card" style={{ marginBottom: '1.5rem' }}>
      <div className="metric-eyebrow">
        <span>🎯 Mục Tiêu Tiết Kiệm & Tích Lũy</span>
        {!isAdding && (
          <button className="btn-link" onClick={() => setIsAdding(true)} style={{ fontSize: '0.825rem', color: 'var(--ocean-600)', fontWeight: 600 }}>
            + Thêm Mục Tiêu
          </button>
        )}
      </div>
      <div className="goals-grid">
        {goals.map((g) => <GoalCard key={g.id} goal={g} />)}
      </div>
      {isAdding && <NewGoalForm onAdd={handleAdd} onCancel={() => setIsAdding(false)} />}
    </div>
  );
}
