import React from 'react';

export function Footer() {
  return (
    <footer className="footer-attribution">
      <div className="footer-content">
        <div className="footer-brand">
          <strong>SmartFinance VND</strong>
          <p>Quản lý tài chính cá nhân, cảnh báo ngân sách tức thì và trợ lý Gemini.</p>
        </div>
        <div className="footer-credits">
          <span className="credit-tag">Linh vật pixel:</span>
          <a href="https://opengameart.org/content/piglook-sprite-sheet-32x32" target="_blank" rel="noreferrer">Natural_Privateer</a>
          <span>&</span>
          <a href="https://opengameart.org/content/pixel-coins-asset" target="_blank" rel="noreferrer">truezipp</a>
          <span>(CC0)</span>
          <span className="credit-tag" style={{ marginLeft: '0.75rem' }}>Chuyển động:</span>
          <span>Motion (MIT)</span>
        </div>
      </div>
      <div className="footer-bottom">
        <span>Tôn trọng chế độ prefers-reduced-motion · Dữ liệu gửi AI chỉ ở dạng tổng hợp theo danh mục</span>
      </div>
    </footer>
  );
}
