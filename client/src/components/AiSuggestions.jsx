import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api.js';
import { formatVND } from '../utils/formatters.js';
import { SPRITES } from '../pet/sprites.js';

const TYPE_LABEL = { WARNING: 'Cảnh báo', SAVING: 'Tiết kiệm', OPTIMIZATION: 'Tối ưu', INFO: 'Đề xuất' };

function BotSleepingModal({ isOpen, onClose, reason }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className="modal-content"
            style={{ textAlign: 'center', maxWidth: '380px', padding: '1.75rem 1.25rem' }}
            initial={{ scale: 0.96, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <img className="pixelated-pet" src={SPRITES.sad_1} alt="" width={96} height={96} style={{ margin: '0 auto 0.5rem' }} />
            <h3 className="modal-title" style={{ marginBottom: '0.4rem' }}>Bot đang ngủ rồi</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>
              Gemini tạm thời không phản hồi nên hệ thống dùng bộ quy tắc định lượng dự phòng.
            </p>
            {reason && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Lý do: {reason}</p>}
            <button className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={onClose}>Đã hiểu</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Hồi quy tuyến tính chi tiêu để dự báo 1–3 tháng (chạy tại trình duyệt). */
function buildForecast(trend, month) {
  const expenses = trend.map((t) => t.expense);
  const n = expenses.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += expenses[i]; sumXY += i * expenses[i]; sumXX += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
  const intercept = (sumY - slope * sumX) / n;
  let sumResidualSq = 0;
  for (let i = 0; i < n; i++) sumResidualSq += (expenses[i] - (intercept + slope * i)) ** 2;
  const margin = Math.round(Math.sqrt(sumResidualSq / Math.max(1, n - 2)) * 1.2);

  const [y, m] = month.split('-').map(Number);
  const list = [];
  for (let k = 1; k <= 3; k++) {
    const d = new Date(y, m - 1 + k, 1);
    const predicted = Math.max(0, Math.round(intercept + slope * (n - 1 + k)));
    list.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      predictedExpense: predicted,
      lowerBound: Math.max(0, predicted - margin),
      upperBound: predicted + margin
    });
  }
  return { list, margin };
}

/** Lời khuyên cục bộ bổ sung (gói định kỳ, quy tắc 50/30/20) – không cần mạng. */
function buildLocalAdvice({ trend, budgets, month, subscriptions, forecast }) {
  const cards = [];
  const activeSubs = subscriptions.filter((s) => s.status === 'ACTIVE');
  const subMonthly = activeSubs.reduce((sum, s) => sum + (s.cycle === 'YEARLY' ? Math.round(s.price / 12) : s.price), 0);
  if (subMonthly > 100000) {
    cards.push({
      type: 'OPTIMIZATION',
      category: 'Gói định kỳ',
      message: `Tổng phí gói gia hạn ${formatVND(subMonthly)}/tháng (${formatVND(subMonthly * 12)}/năm). Rà soát hủy gói ít dùng.`,
      savingPotential: Math.round(subMonthly * 0.3)
    });
  }
  if (forecast.list.length) {
    const next = forecast.list[0];
    cards.push({
      type: 'INFO',
      category: `Dự báo tháng ${next.month.substring(5)}`,
      message: `Chi tiêu tháng tới dự báo ${formatVND(next.predictedExpense)} (từ ${formatVND(next.lowerBound)} đến ${formatVND(next.upperBound)}).`,
      savingPotential: 0
    });
  }
  const cur = trend.find((t) => t.month === month);
  if (cur && cur.income > 0) {
    const net = cur.income - cur.expense;
    const rate = Math.round((net / cur.income) * 100);
    if (rate < 20) {
      const gap = Math.round(cur.income * 0.2) - net;
      cards.push({
        type: 'WARNING',
        category: 'Quy tắc 50/30/20',
        message: `Tỷ lệ tiết kiệm ${rate}% (dưới chuẩn 20%). Cần tối ưu thêm ${formatVND(gap)}.`,
        savingPotential: gap
      });
    }
  }
  if (!budgets.length) {
    cards.push({ type: 'INFO', category: 'Hạn mức', message: 'Chưa đặt hạn mức tháng này – đặt hạn mức để AI phân tích sát hơn.', savingPotential: 0 });
  }
  return cards;
}

function useAiSuggestions(month) {
  const [state, setState] = useState({ status: 'idle', data: null, error: null });
  const run = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const data = await api.getAiSuggestions(month);
      setState({ status: 'done', data, error: null });
    } catch (err) {
      setState({ status: 'error', data: null, error: err.message });
    }
  }, [month]);
  useEffect(() => { run(); }, [run]);
  return { ...state, run };
}

function EnginePill({ status, data, onOpenSleeping }) {
  if (status === 'loading') return <span className="engine-pill loading"><span className="dot" />Gemini đang phân tích…</span>;
  if (data?.engine === 'GEMINI_FLASH') {
    return <span className="engine-pill ai" title={data.model}><span className="dot" />Gemini Flash AI</span>;
  }
  return (
    <button type="button" className="engine-pill fallback" onClick={onOpenSleeping}>
      <span className="dot" />Quy tắc dự phòng
    </button>
  );
}

function SuggestionTile({ item, index }) {
  return (
    <motion.div
      className={`suggestion-tile ${item.type}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.28, ease: [0.2, 0, 0, 1] }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
        <strong style={{ fontSize: '0.9rem', color: 'var(--text-title)' }}>{item.category}</strong>
        <span className={`ai-type-tag ${item.type}`}>{TYPE_LABEL[item.type] || item.type}</span>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.55 }}>{item.message}</p>
      {item.savingPotential > 0 && (
        <div className="num-tabular" style={{ fontSize: '0.78rem', color: 'var(--color-income)', fontWeight: 700, marginTop: '0.35rem' }}>
          Tiềm năng tiết kiệm: +{formatVND(item.savingPotential)}
        </div>
      )}
    </motion.div>
  );
}

export function AiSuggestions({ trend = [], budgets = [], month, subscriptions = [] }) {
  const [showSleeping, setShowSleeping] = useState(false);
  const ai = useAiSuggestions(month);

  const hasHistory = trend.filter((t) => t.expense > 0 || t.income > 0).length >= 2;
  const forecast = hasHistory ? buildForecast(trend, month) : { list: [], margin: 0 };
  const local = buildLocalAdvice({ trend, budgets, month, subscriptions, forecast });
  const isGemini = ai.data?.engine === 'GEMINI_FLASH';
  const aiItems = ai.data?.suggestions || [];

  return (
    <div className="ai-advisor-panel">
      <BotSleepingModal isOpen={showSleeping} onClose={() => setShowSleeping(false)} reason={ai.data?.fallbackReason || ai.error} />

      <div className="section-header">
        <div>
          <h2 className="section-title">Trợ lý tài chính · {month}</h2>
          <span className="dash-sub">Gemini phân tích số liệu đã tổng hợp theo danh mục, không gửi giao dịch thô</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <EnginePill status={ai.status} data={ai.data} onOpenSleeping={() => setShowSleeping(true)} />
          <button className="btn btn-sm" onClick={ai.run} disabled={ai.status === 'loading'}>
            ✨ Phân tích bằng Gemini Flash
          </button>
        </div>
      </div>

      <div className="metric-card ai-summary-card" style={{ marginBottom: '0.9rem' }}>
        <img
          className="pixelated-pet"
          src={ai.status === 'loading' ? SPRITES.eat_2 : isGemini ? SPRITES.happy_1 : SPRITES.idle_1}
          alt=""
          width={64}
          height={64}
        />
        <div>
          <div className="metric-eyebrow" style={{ marginBottom: '0.2rem' }}>
            <span>Đánh giá tổng quan</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={ai.status + (ai.data?.summary || '')}
              className={`ai-summary-text ${ai.status === 'loading' ? 'typing-caret' : ''}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {ai.status === 'loading' && 'Heo AI đang đọc số liệu tháng này'}
              {ai.status === 'error' && `Không gọi được máy chủ AI: ${ai.error}`}
              {ai.status === 'done' && ai.data?.summary}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {forecast.list.length > 0 && (
        <div className="metric-card" style={{ marginBottom: '0.9rem' }}>
          <div className="metric-eyebrow">
            <span>Dự báo chi tiêu 1–3 tháng tới (hồi quy tuyến tính)</span>
            <span className="muted-note">Biên độ ±{formatVND(forecast.margin)}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem', marginTop: '0.5rem' }}>
            {forecast.list.map((f) => (
              <div key={f.month} style={{ background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tháng {f.month}</div>
                <div className="num-tabular" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-title)', margin: '0.15rem 0' }}>
                  {formatVND(f.predictedExpense)}
                </div>
                <div className="num-tabular" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {formatVND(f.lowerBound)} – {formatVND(f.upperBound)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0.25rem 0 0.6rem' }}>
        {isGemini ? 'Gợi ý từ Gemini' : 'Gợi ý theo quy tắc định lượng'} <span className="muted-note">(tối đa 5)</span>
      </h3>
      <div className="suggestions-deck" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
        {ai.status === 'loading' && [0, 1, 2].map((i) => <div key={i} className="skeleton-box" style={{ height: 72, borderRadius: 10 }} />)}
        {ai.status !== 'loading' && aiItems.length === 0 && (
          <div className="suggestion-tile INFO"><p style={{ fontSize: '0.85rem' }}>Chưa có gợi ý cho tháng này – hãy đặt hạn mức và ghi thêm giao dịch.</p></div>
        )}
        {ai.status !== 'loading' && aiItems.map((item, i) => <SuggestionTile key={item.id ?? i} item={item} index={i} />)}
      </div>

      {local.length > 0 && (
        <>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.6rem' }}>Ghi chú thêm từ dữ liệu của bạn</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {local.slice(0, 3).map((item, i) => <SuggestionTile key={item.category} item={item} index={i} />)}
          </div>
        </>
      )}
    </div>
  );
}
