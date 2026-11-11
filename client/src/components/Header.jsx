import React from 'react';
import { formatVND } from '../utils/formatters.js';
import { SPRITES } from '../pet/sprites.js';

function BrandBlock() {
  return (
    <div className="brand-block">
      <div className="brand-mark" aria-hidden="true">
        <img className="pixelated-pet" src={SPRITES.idle_1} alt="" width={32} height={32} />
      </div>
      <div>
        <h1 className="brand-name">SmartFinance</h1>
        <span className="brand-tagline">Quản Trị Tài Chính & Ngân Sách</span>
      </div>
    </div>
  );
}

function MonthNavigator({ currentMonth, onMonthChange }) {
  const handleShiftMonth = (offset) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(newMonth);
  };

  return (
    <div className="month-navigator">
      <button className="month-nav-btn" onClick={() => handleShiftMonth(-1)} title="Tháng trước">◀</button>
      <input id="monthSelect" type="month" value={currentMonth} onChange={(e) => onMonthChange(e.target.value)} />
      <button className="month-nav-btn" onClick={() => handleShiftMonth(1)} title="Tháng sau">▶</button>
    </div>
  );
}

function NetBalancePill({ netBalance }) {
  const isNegative = netBalance < 0;
  return (
    <div className={`net-balance-pill ${isNegative ? 'negative' : ''}`}>
      <span className="balance-status-dot" />
      <span>Số dư ròng:</span>
      <span className="num-tabular">{formatVND(netBalance)}</span>
    </div>
  );
}

export function Header({
  currentMonth,
  onMonthChange,
  netBalance = 0,
  theme = 'light',
  onToggleTheme,
  isPetEnabled = true,
  onTogglePet,
  onLogout
}) {
  return (
    <header className="app-header">
      <BrandBlock />
      <div className="header-tools">
        <MonthNavigator currentMonth={currentMonth} onMonthChange={onMonthChange} />
        <NetBalancePill netBalance={netBalance} />
        <button
          type="button"
          className="icon-btn"
          aria-pressed={isPetEnabled}
          onClick={() => onTogglePet?.()}
          title="Bật/tắt pet nổi góc trái dưới"
        >
          <img className="pixelated-pet" src={SPRITES.idle_1} alt="" width={32} height={32} />
          Pet nổi: {isPetEnabled ? 'Bật' : 'Tắt'}
        </button>
        <button type="button" className="icon-btn" onClick={onToggleTheme} title="Đổi giao diện sáng/tối">
          {theme === 'dark' ? 'Sáng' : 'Tối'}
        </button>
        {onLogout && (
          <button type="button" className="icon-btn" onClick={onLogout} title="Quay lại trang đăng nhập">
            Đăng xuất
          </button>
        )}
      </div>
    </header>
  );
}
