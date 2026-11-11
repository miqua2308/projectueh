import React, { useEffect, useRef } from 'react';
import { formatVND } from '../utils/formatters.js';

// 1. Grouped Bar Chart: Thu vs Chi theo tháng
export function MonthlyGroupedBarChart({ trend = [] }) {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !window.Chart || trend.length === 0) return;
    if (chartInstance.current) chartInstance.current.destroy();

    const ctx = canvasRef.current.getContext('2d');
    chartInstance.current = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: trend.map((t) => 'T' + t.month.substring(5)),
        datasets: [
          {
            label: 'Thu nhập',
            data: trend.map((t) => t.income),
            backgroundColor: '#059669',
            borderRadius: 4
          },
          {
            label: 'Chi tiêu',
            data: trend.map((t) => t.expense),
            backgroundColor: '#e11d48',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 10, font: { size: 11 } } },
          tooltip: {
            callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatVND(ctx.raw)}` }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: {
            ticks: {
              font: { size: 10 },
              callback: (v) => (v >= 1000000 ? (v / 1000000) + 'M' : v)
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [trend]);

  return (
    <div style={{ height: '210px', position: 'relative' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

// 2. Line Chart: Xu hướng chi tiêu & Số dư, phần dự báo vẽ nét đứt
export function TrendAndForecastLineChart({ trend = [], forecast = [] }) {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !window.Chart || trend.length === 0) return;
    if (chartInstance.current) chartInstance.current.destroy();

    const n = trend.length;
    const historyLabels = trend.map((t) => 'T' + t.month.substring(5));
    const forecastLabels = forecast.map((f) => `T${f.month.substring(5)} (Dự báo)`);
    const allLabels = [...historyLabels, ...forecastLabels];

    const expData = trend.map((t) => t.expense);
    const historyExpense = [...expData, ...forecast.map(() => null)];

    // Dotted forecast line starts at last historical point
    const forecastExpense = new Array(n - 1).fill(null);
    forecastExpense.push(expData[n - 1]);
    forecast.forEach((f) => forecastExpense.push(f.predictedExpense));

    const netHistory = trend.map((t) => t.income - t.expense);
    const netLine = [...netHistory, ...forecast.map(() => null)];

    const ctx = canvasRef.current.getContext('2d');
    chartInstance.current = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: allLabels,
        datasets: [
          {
            label: 'Chi tiêu thực tế',
            data: historyExpense,
            borderColor: '#e11d48',
            borderWidth: 2,
            pointRadius: 3,
            tension: 0.3
          },
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
          {
            label: 'Số dư ròng',
            data: netLine,
            borderColor: '#0284c7',
            borderWidth: 1.8,
            pointRadius: 3,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 10, font: { size: 10 } } },
          tooltip: {
            callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatVND(ctx.raw)}` }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: {
            ticks: {
              font: { size: 10 },
              callback: (v) => (v / 1000000).toFixed(1) + 'M'
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [trend, forecast]);

  return (
    <div style={{ height: '210px', position: 'relative' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

// 3. Donut Chart: Cơ cấu chi theo danh mục
export function CategoryDonutChart({ breakdown = [] }) {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !window.Chart) return;
    if (chartInstance.current) chartInstance.current.destroy();

    const labels = breakdown.map((b) => b.categoryName);
    const data = breakdown.map((b) => b.total);
    const colors = breakdown.map((b) => b.color || '#0284c7');

    const ctx = canvasRef.current.getContext('2d');
    chartInstance.current = new window.Chart(ctx, {
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
          legend: { position: 'right', labels: { boxWidth: 8, font: { size: 10.5 } } },
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
    });

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [breakdown]);

  return (
    <div style={{ height: '210px', position: 'relative' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

// 4. Stacked Bar Chart: Chi theo danh mục qua các tháng
export function MonthlyStackedCategoryChart({ stackedData = { months: [], datasets: [] } }) {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !window.Chart || stackedData.months.length === 0) return;
    if (chartInstance.current) chartInstance.current.destroy();

    const ctx = canvasRef.current.getContext('2d');
    chartInstance.current = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: stackedData.months.map((m) => 'T' + m.substring(5)),
        datasets: stackedData.datasets.map((ds) => ({ ...ds, stack: 'expenses' }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 8, font: { size: 10 } } },
          tooltip: {
            callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatVND(ctx.raw)}` }
          }
        },
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { font: { size: 10 } } },
          y: {
            stacked: true,
            ticks: {
              font: { size: 10 },
              callback: (v) => (v / 1000000) + 'M'
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [stackedData]);

  return (
    <div style={{ height: '210px', position: 'relative' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

// 5. Area Chart: Dòng tiền ròng tích lũy (Cumulative Net Cashflow)
export function CumulativeCashflowAreaChart({ trend = [] }) {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !window.Chart || trend.length === 0) return;
    if (chartInstance.current) chartInstance.current.destroy();

    let runningTotal = 0;
    const cumulative = trend.map((t) => {
      runningTotal += (t.income - t.expense);
      return runningTotal;
    });

    const ctx = canvasRef.current.getContext('2d');
    chartInstance.current = new window.Chart(ctx, {
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
          tooltip: {
            callbacks: { label: (ctx) => `Tích lũy ròng: ${formatVND(ctx.raw)}` }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: {
            ticks: {
              font: { size: 10 },
              callback: (v) => (v / 1000000).toFixed(1) + 'M'
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [trend]);

  return (
    <div style={{ height: '210px', position: 'relative' }}>
      <canvas ref={canvasRef} />
    </div>
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
              <div
                className="progress-bar"
                style={{ width: `${Math.min(100, b.percentage)}%`, backgroundColor: color }}
              />
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
