import React from 'react';

/** Khối xám nhấp nháy; kích thước truyền qua style/className. */
export function SkeletonBlock({ w = '100%', h = 12, style, className = '' }) {
  return <div className={`skeleton-line ${className}`} style={{ width: w, height: h, ...style }} aria-hidden="true" />;
}

function KpiSkeleton() {
  return (
    <div className="metric-card skeleton-card">
      <SkeletonBlock w="45%" h={12} />
      <SkeletonBlock w="70%" h={26} style={{ margin: '0.8rem 0' }} />
      <SkeletonBlock w="60%" h={11} />
    </div>
  );
}

function ChartCardSkeleton() {
  return (
    <div className="metric-card skeleton-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.9rem' }}>
        <SkeletonBlock w="48%" h={12} />
        <SkeletonBlock w="22%" h={12} />
      </div>
      <div className="skeleton-box" style={{ height: 210 }} />
    </div>
  );
}

/** Khớp bố cục Tổng quan: 4 KPI, banner báo cáo, 3 hàng × 2 biểu đồ. */
export function DashboardSkeleton() {
  return (
    <div className="dashboard-stack" role="status" aria-busy="true" aria-label="Đang tải dữ liệu tổng quan">
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {[0, 1, 2, 3].map((i) => <KpiSkeleton key={i} />)}
      </div>
      <div className="hero-bento-banner skeleton-card" style={{ marginBottom: '0.9rem' }}>
        <SkeletonBlock w="38%" h={16} style={{ marginBottom: 8 }} />
        <SkeletonBlock w="58%" h={11} />
      </div>
      {[0, 1, 2].map((row) => (
        <div className="chart-grid" key={row}>
          <ChartCardSkeleton />
          <ChartCardSkeleton />
        </div>
      ))}
    </div>
  );
}

/** Danh sách (giao dịch, hạn mức): thanh tiêu đề + các dòng. */
export function ListSkeleton({ rows = 6, label = 'Đang tải danh sách' }) {
  return (
    <div className="metric-card skeleton-card" role="status" aria-busy="true" aria-label={label}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <SkeletonBlock w="30%" h={18} />
        <SkeletonBlock w={110} h={32} style={{ borderRadius: 10 }} />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1fr', gap: '1rem', alignItems: 'center', padding: '0.7rem 0', borderTop: '1px solid var(--border-hairline)' }}
        >
          <SkeletonBlock w="70%" h={12} />
          <SkeletonBlock w={`${55 + ((i * 17) % 35)}%`} h={12} />
          <SkeletonBlock w="60%" h={12} style={{ justifySelf: 'end' }} />
        </div>
      ))}
    </div>
  );
}
