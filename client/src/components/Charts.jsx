import React, { useEffect, useRef, useState } from 'react';
import { formatVND } from '../utils/formatters.js';

const CHART_HEIGHT = 210;
const CHART_HEIGHT_NARROW = 240; // mobile: chú giải xuống dưới nên cần cao hơn

function useIsNarrow() {
  const query = '(max-width: 640px)';
  const [narrow, setNarrow] = useState(() => {
    try { return window.matchMedia(query).matches; } catch { return false; }
  });
  useEffect(() => {
    let mq;
    try { mq = window.matchMedia(query); } catch { return undefined; }
    const onChange = (e) => setNarrow(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return narrow;
}

function prefersReducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

/**
 * Khung vẽ Chart.js dùng chung.
 * - Chỉ huỷ/vẽ lại khi NỘI DUNG dữ liệu (dataKey) đổi, không phải khi tham chiếu props đổi.
 *   (Trước đây props dẫn xuất mới ở mỗi lần render khiến biểu đồ vẽ lại + chạy animation liên tục.)
 * - Hiện skeleton cho tới khi biểu đồ vẽ xong lần đầu; chờ thư viện Chart.js (CDN) nếu chưa tải.
 */
function ChartCanvas({ dataKey, enabled = true, build, emptyText = 'Chưa có dữ liệu' }) {
  const canvasRef = useRef(null);
  const buildRef = useRef(build);
  buildRef.current = build;
  const [libReady, setLibReady] = useState(() => Boolean(window.Chart));
  const [ready, setReady] = useState(false);
  const narrow = useIsNarrow();

  useEffect(() => {
    if (libReady) return undefined;
    const timer = setInterval(() => {
      if (window.Chart) {
        setLibReady(true);
        clearInterval(timer);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [libReady]);

  useEffect(() => {
    if (!enabled || !libReady || !canvasRef.current) return undefined;
    const config = buildRef.current({ narrow });
    config.options = {
      ...config.options,
      animation: { duration: prefersReducedMotion() ? 0 : 600 },
      resizeDelay: 120
    };
    const chart = new window.Chart(canvasRef.current.getContext('2d'), config);
    setReady(true);
    return () => chart.destroy();
  }, [dataKey, enabled, libReady, narrow]);

  if (!enabled) {
    return <div className="chart-frame chart-empty" style={{ height: narrow ? CHART_HEIGHT_NARROW : CHART_HEIGHT }}>{emptyText}</div>;
  }

  return (
    <div className="chart-frame" data-ready={ready} style={{ height: narrow ? CHART_HEIGHT_NARROW : CHART_HEIGHT }}>
      <canvas ref={canvasRef} />
      <div className="skeleton-box chart-skeleton" aria-hidden="true" />
    </div>
  );
}

/** Nhãn trục tiền: 1,5M · 250K · 0 – không bao giờ in số mũ (1e-7M). */
function axisMoney(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '';
  const abs = Math.abs(n);
  if (abs >= 1e6) return `${+(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${+(n / 1e3).toFixed(0)}K`;
  return String(Math.round(n));
}

const hasPositive = (arr) => arr.some((x) => Number(x) > 0);

const tooltipByLabel = {
  callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatVND(ctx.raw)}` }
};

// 1. Grouped Bar Chart: Thu vs Chi theo tháng
export function MonthlyGroupedBarChart({ trend = [] }) {
  return (
    <ChartCanvas
      enabled={trend.length > 0 && hasPositive(trend.flatMap((t) => [t.income, t.expense]))}
      dataKey={JSON.stringify(trend)}
      build={() => ({
        type: 'bar',
        data: {
          labels: trend.map((t) => 'T' + t.month.substring(5)),
          datasets: [
            { label: 'Thu nhập', data: trend.map((t) => t.income), backgroundColor: '#059669', borderRadius: 4 },
            { label: 'Chi tiêu', data: trend.map((t) => t.expense), backgroundColor: '#e11d48', borderRadius: 4 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'top', labels: { boxWidth: 10, font: { size: 11 } } }, tooltip: tooltipByLabel },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 } } },
            y: { ticks: { font: { size: 10 }, callback: axisMoney } }
          }
        }
      })}
    />
  );
}

// 2. Line Chart: Xu hướng chi tiêu & Số dư, phần dự báo vẽ nét đứt
export function TrendAndForecastLineChart({ trend = [], forecast = [] }) {
  return (
    <ChartCanvas
      enabled={trend.length > 0}
      dataKey={JSON.stringify([trend, forecast])}
      build={() => {
        const n = trend.length;
        const allLabels = [
          ...trend.map((t) => 'T' + t.month.substring(5)),
          ...forecast.map((f) => `T${f.month.substring(5)} (Dự báo)`)
        ];
        const expData = trend.map((t) => t.expense);
        const historyExpense = [...expData, ...forecast.map(() => null)];

        // Đường dự báo nét đứt bắt đầu từ điểm lịch sử cuối cùng
        const forecastExpense = new Array(n - 1).fill(null);
        forecastExpense.push(expData[n - 1]);
        forecast.forEach((f) => forecastExpense.push(f.predictedExpense));

        const netLine = [...trend.map((t) => t.income - t.expense), ...forecast.map(() => null)];

        return {
          type: 'line',
          data: {
            labels: allLabels,
            datasets: [
              { label: 'Chi tiêu thực tế', data: historyExpense, borderColor: '#e11d48', borderWidth: 2, pointRadius: 3, tension: 0.3 },
              {
                label: 'Dự báo chi tiêu AI',
                data: forecastExpense,
                borderColor: '#e11d48',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 4,
                pointBackgroundColor: '#e11d48',
                tension: 0.2
              },
              { label: 'Số dư ròng', data: netLine, borderColor: '#0284c7', borderWidth: 1.8, pointRadius: 3, tension: 0.3 }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { boxWidth: 10, font: { size: 10 } } }, tooltip: tooltipByLabel },
            scales: {
              x: { grid: { display: false }, ticks: { font: { size: 10 } } },
              y: { ticks: { font: { size: 10 }, callback: axisMoney } }
            }
          }
        };
      }}
    />
  );
}

// 3. Donut Chart: Cơ cấu chi theo danh mục
export function CategoryDonutChart({ breakdown = [] }) {
  return (
    <ChartCanvas
      dataKey={JSON.stringify(breakdown)}
      build={({ narrow }) => {
        const labels = breakdown.map((b) => b.categoryName);
        const data = breakdown.map((b) => b.total);
        const colors = breakdown.map((b) => b.color || '#0284c7');
        return {
          type: 'doughnut',
          data: {
            labels: labels.length > 0 ? labels : ['Chưa có dữ liệu'],
            datasets: [{
              data: data.length > 0 ? data : [1],
              backgroundColor: colors.length > 0 ? colors : ['#e2e8f0'],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
              legend: { position: narrow ? 'bottom' : 'right', labels: { boxWidth: 8, font: { size: 10.5 } } },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                    const pct = total > 0 ? Math.round((ctx.raw / total) * 100) : 0;
                    return ` ${ctx.label}: ${formatVND(ctx.raw)} (${pct}%)`;
                  }
                }
              }
            }
          }
        };
      }}
    />
  );
}

// 4. Stacked Bar Chart: Chi theo danh mục qua các tháng
export function MonthlyStackedCategoryChart({ stackedData = { months: [], datasets: [] } }) {
  return (
    <ChartCanvas
      enabled={stackedData.months.length > 0 && stackedData.datasets.some((ds) => hasPositive(ds.data))}
      emptyText="Chưa có khoản chi nào để phân bổ theo danh mục"
      dataKey={JSON.stringify(stackedData)}
      build={() => ({
        type: 'bar',
        data: {
          labels: stackedData.months.map((m) => 'T' + m.substring(5)),
          datasets: stackedData.datasets.map((ds) => ({ ...ds, stack: 'expenses' }))
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'top', labels: { boxWidth: 8, font: { size: 10 } } }, tooltip: tooltipByLabel },
          scales: {
            x: { stacked: true, grid: { display: false }, ticks: { font: { size: 10 } } },
            y: { stacked: true, beginAtZero: true, ticks: { font: { size: 10 }, callback: axisMoney } }
          }
        }
      })}
    />
  );
}

// 5. Area Chart: Dòng tiền ròng tích lũy (Cumulative Net Cashflow)
export function CumulativeCashflowAreaChart({ trend = [] }) {
  return (
    <ChartCanvas
      enabled={trend.length > 0}
      dataKey={JSON.stringify(trend)}
      build={() => {
        let runningTotal = 0;
        const cumulative = trend.map((t) => {
          runningTotal += t.income - t.expense;
          return runningTotal;
        });
        return {
          type: 'line',
          data: {
            labels: trend.map((t) => 'T' + t.month.substring(5)),
            datasets: [{
              label: 'Dòng tiền tích lũy',
              data: cumulative,
              fill: true,
              borderColor: '#0284c7',
              backgroundColor: 'rgba(2, 132, 199, 0.15)',
              tension: 0.35,
              pointRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: (ctx) => `Tích lũy ròng: ${formatVND(ctx.raw)}` } }
            },
            scales: {
              x: { grid: { display: false }, ticks: { font: { size: 10 } } },
              y: { ticks: { font: { size: 10 }, callback: axisMoney } }
            }
          }
        };
      }}
    />
  );
}

// 6. Progress Bars: Mức dùng hạn mức từng danh mục
export function BudgetUsageProgressList({ budgets = [] }) {
  if (budgets.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem', textAlign: 'center' }}>
        Chưa có danh mục nào được đặt hạn mức trong tháng.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      {budgets.map((b) => {
        const isOver = b.status === 'EXCEEDED_100';
        const isWarn = b.status === 'WARNING_80';
        const color = isOver ? 'var(--color-expense)' : isWarn ? 'var(--color-warning)' : 'var(--color-income)';
        const label = isOver ? 'VƯỢT HẠN MỨC' : isWarn ? 'CẢNH BÁO 80%' : 'AN TOÀN';

        return (
          <div key={b.id || b.categoryId}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.2rem' }}>
              <strong style={{ color: 'var(--text-title)' }}>{b.categoryName}</strong>
              <span className="badge-tag" style={{ border: `1px solid ${color}40`, color, background: 'var(--bg-card)', fontSize: '0.725rem' }}>
                {label} ({b.percentage}%)
              </span>
            </div>
            <div className="progress-track" style={{ height: '6px' }}>
              <div className="progress-bar" style={{ width: `${Math.min(100, b.percentage)}%`, backgroundColor: color }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }} className="num-tabular">
              <span>Đã chi: {formatVND(b.spentAmount)}</span>
              <span>Hạn mức: {formatVND(b.budgetAmount)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
