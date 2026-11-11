import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { formatVND, formatDate, getToday } from '../utils/formatters.js';

export function SubscriptionManager({ subscriptions = [], onAddSub, onUpdateSub, onDeleteSub, onRenewSub }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [cycle, setCycle] = useState('MONTHLY');
  const [nextDate, setNextDate] = useState(getToday());
  const [status, setStatus] = useState('ACTIVE');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Enrich with days remaining and urgent flag
  const enriched = subscriptions.map((s) => {
    const next = new Date(s.nextDate);
    next.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((next - today) / (1000 * 60 * 60 * 24));
    const isUrgent = s.status === 'ACTIVE' && diffDays >= 0 && diffDays <= 3;
    return { ...s, diffDays, isUrgent };
  });

  const urgentList = enriched.filter((s) => s.isUrgent);
  const activeList = enriched.filter((s) => s.status === 'ACTIVE');

  // Total cost per month (annual divided by 12)
  const totalMonthlyCost = activeList.reduce((sum, s) => {
    return sum + (s.cycle === 'YEARLY' ? Math.round(s.price / 12) : s.price);
  }, 0);

  const openAddModal = () => {
    setEditingSub(null);
    setName('');
    setPrice('');
    setCycle('MONTHLY');
    setNextDate(getToday());
    setStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const openEditModal = (sub) => {
    setEditingSub(sub);
    setName(sub.name);
    setPrice(sub.price);
    setCycle(sub.cycle);
    setNextDate(sub.nextDate);
    setStatus(sub.status);
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !price || !nextDate) return;
    const subData = {
      name,
      price: Number(price),
      cycle,
      nextDate,
      status
    };

    if (editingSub) {
      onUpdateSub({ ...editingSub, ...subData });
    } else {
      onAddSub({ id: Date.now(), ...subData });
    }
    setIsModalOpen(false);
  };

  const requestNotification = () => {
    if (!('Notification' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ Notifications API.');
      return;
    }
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        if (urgentList.length > 0) {
          new Notification('SmartFinance VND', {
            body: `Cảnh báo: Bạn có ${urgentList.length} gói dịch vụ cần gia hạn trong 3 ngày tới!`,
            icon: 'https://cdn-icons-png.flaticon.com/512/1041/1041888.png'
          });
          alert('Đã bật thông báo đẩy thành công và gửi thông báo nhắc nhở!');
        } else {
          alert('Đã cấp quyền thông báo thành công! Hiện chưa có gói nào sắp hết hạn.');
        }
      } else {
        alert('Quyền gửi thông báo đã bị từ chối.');
      }
    });
  };

  return (
    <div className="subscriptions-panel">
      {/* Urgent Warning Banner */}
      {urgentList.length > 0 && (
        <div className="banner-alert danger" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🚨</span>
            <div>
              <strong>Nhắc nhở gia hạn định kỳ:</strong> Có {urgentList.length} gói sắp đến hạn thanh toán trong 3 ngày tới!
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={requestNotification}>
            🔔 Bật thông báo đẩy
          </button>
        </div>
      )}

      {/* KPI Header */}
      <div className="metrics-grid" style={{ marginBottom: '1.25rem' }}>
        <div className="metric-card">
          <div className="metric-eyebrow">Tổng Chi Phí Gói / Tháng</div>
          <div className="metric-value num-tabular" style={{ color: 'var(--ocean-600)' }}>
            {formatVND(totalMonthlyCost)}
          </div>
          <div className="metric-subline">Quy đổi trung bình mỗi tháng</div>
        </div>
        <div className="metric-card">
          <div className="metric-eyebrow">Số Gói Đang Hoạt Động</div>
          <div className="metric-value num-tabular">{activeList.length}</div>
          <div className="metric-subline">Gemini Pro, YouTube, Spotify...</div>
        </div>
        <div className="metric-card">
          <div className="metric-eyebrow">Sắp Gia Hạn (≤ 3 Ngày)</div>
          <div className="metric-value num-tabular" style={{ color: urgentList.length > 0 ? 'var(--color-expense)' : 'var(--text-title)' }}>
            {urgentList.length}
          </div>
          <div className="metric-subline">Cần rà soát gia hạn hoặc hủy</div>
        </div>
      </div>

      {/* Subscriptions List Card */}
      <div className="metric-card">
        <div className="metric-eyebrow">
          <span>🔄 Danh Sách Gói Gia Hạn Định Kỳ</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={requestNotification}>
              🔔 Bật thông báo
            </button>
            <button className="btn btn-sm" onClick={openAddModal}>
              + Thêm Gói
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.85rem' }}>
          {enriched.map((s) => {
            const isCanceled = s.status === 'CANCELED';
            let badgeBg = 'var(--color-income-soft)';
            let badgeColor = 'var(--color-income)';
            let badgeText = `Còn ${s.diffDays} ngày`;

            if (isCanceled) {
              badgeBg = 'var(--slate-100)';
              badgeColor = 'var(--text-muted)';
              badgeText = 'Đã hủy gói';
            } else if (s.diffDays < 0) {
              badgeBg = 'var(--color-expense-soft)';
              badgeColor = 'var(--color-expense)';
              badgeText = `Quá hạn ${Math.abs(s.diffDays)} ngày`;
            } else if (s.diffDays <= 3) {
              badgeBg = 'var(--color-expense-soft)';
              badgeColor = 'var(--color-expense)';
              badgeText = `🚨 Còn ${s.diffDays} ngày`;
            } else if (s.diffDays <= 7) {
              badgeBg = 'var(--color-warning-soft)';
              badgeColor = 'var(--color-warning)';
              badgeText = `⚠️ Còn ${s.diffDays} ngày`;
            }

            return (
              <div
                key={s.id}
                className={`subscription-item ${s.isUrgent ? 'urgent' : ''}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  border: `1px solid ${s.isUrgent ? 'var(--color-expense)' : 'var(--border-hairline)'}`,
                  borderRadius: 'var(--radius-sm)',
                  background: s.isUrgent ? 'var(--color-expense-soft)' : 'var(--bg-card)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <strong style={{ fontSize: '0.925rem', color: 'var(--text-title)' }}>{s.name}</strong>
                    <span
                      className="badge-tag"
                      style={{ background: badgeBg, color: badgeColor, border: `1px solid ${badgeColor}40` }}
                    >
                      {badgeText}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }} className="num-tabular">
                    Giá: <strong>{formatVND(s.price)}</strong> / {s.cycle === 'YEARLY' ? 'năm' : 'tháng'} • Ngày gia hạn kế tiếp: <strong>{formatDate(s.nextDate)}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onRenewSub(s.id)}
                    title="Gia hạn tự động cộng thêm chu kỳ"
                  >
                    🔄 Gia Hạn
                  </button>
                  <button
                    className={`btn btn-sm ${isCanceled ? 'btn-secondary' : 'btn-danger-soft'}`}
                    onClick={() => onUpdateSub({ ...s, status: isCanceled ? 'ACTIVE' : 'CANCELED' })}
                  >
                    {isCanceled ? 'Kích hoạt lại' : 'Đã hủy'}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(s)}>
                    Sửa
                  </button>
                  <button className="btn-ghost-danger" onClick={() => onDeleteSub(s.id)}>
                    Xóa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingSub ? 'Sửa Gói Gia Hạn' : '+ Thêm Gói Gia Hạn Mới'}</h2>
              <button className="alert-banner-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tên Gói Dịch Vụ</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%' }}
                  placeholder="VD: Netflix, iCloud..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Giá Tiền (VND)</label>
                <input
                  type="number"
                  className="form-input"
                  style={{ width: '100%' }}
                  placeholder="VD: 79000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Chu Kỳ Thanh Toán</label>
                <select className="form-select" style={{ width: '100%' }} value={cycle} onChange={(e) => setCycle(e.target.value)}>
                  <option value="MONTHLY">Hàng tháng</option>
                  <option value="YEARLY">Hàng năm</option>
                </select>
              </div>
              <div className="form-group">
                <label>Ngày Gia Hạn Tiếp Theo</label>
                <input
                  type="date"
                  className="form-input"
                  style={{ width: '100%' }}
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Trạng Thái</label>
                <select className="form-select" style={{ width: '100%' }} value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="ACTIVE">Đang kích hoạt</option>
                  <option value="CANCELED">Đã hủy gói</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn">Lưu Gói</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
