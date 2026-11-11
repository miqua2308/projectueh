import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { formatVND } from '../utils/formatters.js';

export function AlertBanner({ alert, onClose }) {
  if (!alert || !alert.triggered) return null;

  const isExceeded = alert.level === 'EXCEEDED_100';
  const bannerClass = isExceeded ? 'danger' : 'warning';
  const statusLabel = isExceeded ? 'BÁO ĐỘNG VƯỢT NGÂN SÁCH' : 'CẢNH BÁO HẠN MỨC 80%';

  return (
    <AnimatePresence>
      <motion.div
        className={`alert-banner ${bannerClass}`}
        initial={{ opacity: 0, y: -16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <div style={{ fontSize: '1.25rem' }}>{isExceeded ? '🚨' : '⚠️'}</div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {statusLabel}
            </div>
            <div style={{ fontSize: '0.925rem', fontWeight: 600, marginTop: '0.15rem' }}>
              {alert.message}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.85, marginTop: '0.2rem' }} className="num-tabular">
              Tổng đã chi: {formatVND(alert.spentAmount)} / Hạn mức: {formatVND(alert.budgetAmount)} ({alert.percentage}%)
            </div>
          </div>
        </div>
        <button className="alert-banner-close" onClick={onClose} title="Đóng">&times;</button>
      </motion.div>
    </AnimatePresence>
  );
}
