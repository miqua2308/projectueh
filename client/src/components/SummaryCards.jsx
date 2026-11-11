import React, { useEffect, useRef } from 'react';
import { motion, animate } from 'motion/react';
import { formatVND } from '../utils/formatters.js';
import { usePrefersReducedMotion } from '../pet/petController.js';

/** Số đếm lên mượt khi giá trị thay đổi (tắt nếu prefers-reduced-motion). */
function CountUp({ value = 0, format = (v) => String(v), prefix = '' }) {
  const ref = useRef(null);
  const prev = useRef(0);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (reduced) {
      node.textContent = prefix + format(value);
      prev.current = value;
      return undefined;
    }
    const controls = animate(prev.current, value, {
      duration: 0.8,
      ease: [0.2, 0, 0, 1],
      onUpdate: (v) => {
        const shown = Number.isInteger(value) ? Math.round(v) : Math.round(v * 10) / 10;
        node.textContent = prefix + format(shown);
      }
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, reduced]);
  return <span ref={ref}>{prefix + format(value)}</span>;
}

export function SummaryCards({ summary = {}, prevSummary = {}, daysInMonth = 30 }) {
  const { totalIncome = 0, totalExpense = 0, netBalance = 0, savingsRate = 0 } = summary;
  const prevExpense = prevSummary.totalExpense || 0;

  // MoM % change in expenses
  let momExpensePct = 0;
  if (prevExpense > 0) {
    momExpensePct = Math.round(((totalExpense - prevExpense) / prevExpense) * 100);
  }

  // Daily average expense
  const dailyAvg = daysInMonth > 0 ? Math.round(totalExpense / daysInMonth) : 0;

  return (
    <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
      {/* 1. Thu nhập */}
      <motion.div className="metric-card" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
        <div className="metric-eyebrow">
          <span>Tổng Thu Nhập</span>
          <span style={{ color: 'var(--color-income)' }}>Ghi nhận</span>
        </div>
        <div className="metric-value num-tabular" style={{ color: 'var(--color-income)' }}>
          <CountUp value={totalIncome} format={formatVND} prefix="+" />
        </div>
        <div className="metric-subline">Toàn bộ dòng tiền vào trong tháng</div>
      </motion.div>

      {/* 2. Chi tiêu & Chi TB/ngày */}
      <motion.div className="metric-card" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
        <div className="metric-eyebrow">
          <span>Tổng Chi Tiêu</span>
          <span style={{ color: 'var(--color-expense)' }}>Xuất quỹ</span>
        </div>
        <div className="metric-value num-tabular" style={{ color: 'var(--color-expense)' }}>
          <CountUp value={totalExpense} format={formatVND} prefix="-" />
        </div>
        <div className="metric-subline num-tabular">
          Chi trung bình: <strong>{formatVND(dailyAvg)}/ngày</strong>
        </div>
      </motion.div>

      {/* 3. Dòng tiền ròng & MoM % */}
      <motion.div className="metric-card" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
        <div className="metric-eyebrow">
          <span>Dòng Tiền Ròng (Số Dư)</span>
          <span style={{ color: netBalance >= 0 ? 'var(--ocean-600)' : 'var(--color-expense)' }}>
            {netBalance >= 0 ? 'Thặng dư' : 'Thâm hụt'}
          </span>
        </div>
        <div className="metric-value num-tabular" style={{ color: netBalance >= 0 ? 'var(--text-title)' : 'var(--color-expense)' }}>
          <CountUp value={netBalance} format={formatVND} />
        </div>
        <div className="metric-subline">
          So tháng trước (MoM):{' '}
          <strong style={{ color: momExpensePct > 0 ? 'var(--color-expense)' : 'var(--color-income)' }}>
            {momExpensePct > 0 ? `+${momExpensePct}%` : `${momExpensePct}%`}
          </strong>
        </div>
      </motion.div>

      {/* 4. Tỷ lệ tiết kiệm (%) */}
      <motion.div className="metric-card" whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
        <div className="metric-eyebrow">
          <span>Tỷ Lệ Tiết Kiệm</span>
          <span style={{ color: savingsRate >= 20 ? 'var(--color-income)' : 'var(--color-warning)' }}>
            {savingsRate >= 20 ? 'Chuẩn 50/30/20' : 'Cần tối ưu'}
          </span>
        </div>
        <div className="metric-value num-tabular" style={{ color: savingsRate >= 20 ? 'var(--color-income)' : 'var(--text-title)' }}>
          <CountUp value={savingsRate} format={(v) => `${v}%`} />
        </div>
        <div className="metric-subline">
          {totalIncome > 0 ? `Tích lũy ${formatVND(netBalance > 0 ? netBalance : 0)}` : 'Chưa ghi nhận nguồn thu'}
        </div>
      </motion.div>
    </div>
  );
}
