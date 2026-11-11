import React, { useEffect, useMemo, useState } from 'react';
import { motion, useAnimate } from 'motion/react';
import { SPRITES } from '../pet/sprites.js';
import { usePrefersReducedMotion } from '../pet/petController.js';

const EASE_MOVE = [0.7, 0, 0.2, 1]; // con trỏ: bứt tốc rồi hãm gấp – cảm giác "máy" thao tác nhanh
const EASE_DRAW = [0.2, 0, 0, 1];
const GAP = 12;
// Thời lượng (giây) – cố ý rất ngắn: nhiều element nhưng tổng thể ~4s
const T = { move: 0.055, draw: 0.09, grab: 0.05, drag: 0.1 };
const FILL_VAR = { card: '--bg-card', subtle: '--bg-subtle', pig: '--pig', ink: '--ink' };

/**
 * Bố cục các khối mà "Heo AI" sẽ dựng, tính theo kích thước màn hình (desktop & mobile).
 * kind 'draw' = kéo chuột vẽ khối mới; 'copy' = nhấc khối đã có và kéo-thả nhân bản.
 */
function computeLayout(vw, vh) {
  const W = Math.min(1200, vw - 32);
  const narrow = W < 720;
  const H = vh - 48;
  const frameLeft = (vw - W) / 2;
  const blocks = [];
  const byId = {};

  const add = (b) => {
    const nb = { kind: 'draw', fill: 'card', lines: [], ...b };
    blocks.push(nb);
    byId[nb.id] = nb;
    return nb;
  };
  const copy = (srcId, id, x, y, extra = {}) => {
    const nb = { ...byId[srcId], log: undefined, click: false, ...extra, id, copyOf: srcId, kind: 'copy', x, y };
    blocks.push(nb);
    byId[id] = nb;
  };

  // Header: khung + logo heo + 2 pill (tháng, số dư)
  const hh = narrow ? 52 : 64;
  add({ id: 'header', tag: '<Header />', log: 'dựng thanh tiêu đề', x: 0, y: 0, w: W, h: hh });
  add({ id: 'logo', small: true, fill: 'pig', sprite: true, x: 10, y: 10, w: hh - 20, h: hh - 20 });
  const pw = narrow ? 104 : 168;
  const ph = 30;
  const py = (hh - ph) / 2;
  if (narrow) {
    add({ id: 'balance', small: true, fill: 'subtle', lines: [0.6], x: W - pw - 12, y: py, w: pw, h: ph });
  } else {
    add({ id: 'month', small: true, fill: 'subtle', lines: [0.6], x: W - 2 * pw - 22, y: py, w: pw, h: ph });
    copy('month', 'balance', W - pw - 12, py);
  }

  // Điều hướng: khung + các tab (vẽ 1, nhân bản phần còn lại)
  const navY = hh + GAP;
  const navH = 40;
  add({ id: 'nav', tag: '<NavTabs />', log: 'thêm thanh điều hướng', x: 0, y: navY, w: W, h: navH });
  const chipW = narrow ? 72 : 100;
  const chipH = 26;
  const chipY = navY + (navH - chipH) / 2;
  add({ id: 'chip0', small: true, fill: 'subtle', lines: [0.55], x: 7, y: chipY, w: chipW, h: chipH });
  const chips = narrow ? 3 : 4;
  for (let i = 1; i < chips; i++) {
    copy('chip0', `chip${i}`, 7 + i * (chipW + 6), chipY, i === 1 ? { log: 'nhân bản tab' } : {});
  }

  // 4 thẻ KPI
  const kCols = narrow ? 2 : 4;
  const kw = (W - GAP * (kCols - 1)) / kCols;
  const kh = narrow ? 76 : 88;
  const kTop = navY + navH + GAP;
  add({ id: 'kpi0', tag: '<KpiCard />', log: 'vẽ thẻ KPI', lines: [0.45, 0.7, 0.35], x: 0, y: kTop, w: kw, h: kh });
  for (let i = 1; i < 4; i++) {
    copy('kpi0', `kpi${i}`, (i % kCols) * (kw + GAP), kTop + Math.floor(i / kCols) * (kh + GAP), i === 1 ? { log: 'nhân bản KPI ×3' } : {});
  }
  let y = kTop + Math.ceil(4 / kCols) * (kh + GAP);

  // Banner báo cáo + nút CTA (có "click")
  const bh = 48;
  add({ id: 'banner', tag: '<ReportBanner />', log: 'thêm báo cáo tháng', lines: [0.3], x: 0, y, w: W, h: bh });
  const bw = narrow ? 88 : 132;
  add({ id: 'cta', small: true, fill: 'ink', lines: [0.5], click: true, x: W - bw - 10, y: y + (bh - 28) / 2, w: bw, h: 28 });
  y += bh + GAP;

  // Biểu đồ: số hàng/cột và chiều cao theo chỗ còn trống
  const petSize = narrow ? 64 : 96;
  const reserve = petSize + 24; // chừa chỗ cho pet thả xuống + log ở đáy
  const avail = H - reserve - y;
  const cCols = narrow ? 1 : 2;
  const rows = Math.max(1, Math.min(2, Math.floor((avail + GAP) / (84 + GAP))));
  const chH = Math.max(64, Math.min(190, Math.floor((avail - (rows - 1) * GAP) / rows)));
  const cw = (W - GAP * (cCols - 1)) / cCols;
  const defs = [
    ['bar', '<BarChart />', 'vẽ biểu đồ thu/chi'],
    ['line', '<LineChart />', 'vẽ xu hướng + dự báo AI'],
    ['donut', '<DonutChart />', 'vẽ cơ cấu danh mục'],
    ['stack', '<StackedBar />', 'vẽ cột chồng theo tháng']
  ];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cCols; c++) {
      const [chart, tag, log] = defs[(r * cCols + c) % defs.length];
      add({ id: `chart${r}${c}`, tag, log, chart, lines: [0.3], x: c * (cw + GAP), y: y + r * (chH + GAP), w: cw, h: chH });
    }
  }

  // Góc dưới: pet nổi (trái) + nút "xem lại intro" (phải) – toạ độ quy về hệ của khung
  const pet = { size: petSize, x: 12 - frameLeft, y: vh - 12 - petSize - 24 };
  const rw = narrow ? 76 : 128;
  const rh = 36;
  const replay = {
    id: 'replay', kind: 'draw', small: true, fill: 'ink', lines: [0.5],
    log: 'ghim nút xem lại intro', x: vw - frameLeft - 12 - rw, y: vh - 24 - 12 - rh, w: rw, h: rh
  };

  return { W, blocks, pet, replay };
}

function CursorArrow() {
  return (
    <svg width="22" height="26" viewBox="0 0 22 26" aria-hidden="true">
      <path d="M2 1.5 L2 21 L7.2 16.4 L10.6 24 L14 22.5 L10.7 15 L18 15 Z" fill="#2B1E27" stroke="#FFFFFF" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

const BAR_INCOME = [16, 26, 20, 30, 24];
const BAR_EXPENSE = [10, 14, 17, 12, 18];

function Glyph({ type }) {
  const common = { className: 'bb-glyph', 'aria-hidden': true, preserveAspectRatio: 'none', viewBox: '0 0 100 40' };
  if (type === 'bar') {
    return (
      <svg {...common}>
        {[8, 26, 44, 62, 80].map((x, i) => (
          <g key={x}>
            <rect x={x} y={40 - BAR_INCOME[i]} width="7" height={BAR_INCOME[i]} fill="var(--color-income)" />
            <rect x={x + 8} y={40 - BAR_EXPENSE[i]} width="7" height={BAR_EXPENSE[i]} fill="var(--color-expense)" />
          </g>
        ))}
      </svg>
    );
  }
  if (type === 'line') {
    return (
      <svg {...common}>
        <polyline points="0,30 16,22 32,26 48,14 64,18 80,8" fill="none" stroke="var(--color-expense)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
        <polyline points="80,8 90,12 100,6" fill="none" stroke="var(--color-expense)" strokeWidth="1.6" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
        <polyline points="0,36 16,30 32,33 48,24 64,27 80,22" fill="none" stroke="var(--ocean-600)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
      </svg>
    );
  }
  if (type === 'donut') {
    return (
      <svg {...common} viewBox="0 0 40 40" preserveAspectRatio="xMidYMid meet">
        <circle cx="20" cy="20" r="13" fill="none" stroke="var(--ocean-600)" strokeWidth="6" strokeDasharray="38 44" />
        <circle cx="20" cy="20" r="13" fill="none" stroke="var(--pig-deep)" strokeWidth="6" strokeDasharray="26 56" strokeDashoffset="-38" />
        <circle cx="20" cy="20" r="13" fill="none" stroke="var(--gold)" strokeWidth="6" strokeDasharray="14 68" strokeDashoffset="-64" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      {[6, 26, 46, 66].map((x, i) => (
        <g key={x}>
          <rect x={x} y={14 - i} width="14" height={26 + i} fill="var(--ocean-600)" />
          <rect x={x} y={26 - i} width="14" height={14 + i} fill="var(--pig-deep)" />
          <rect x={x} y={34} width="14" height="6" fill="var(--gold)" />
        </g>
      ))}
    </svg>
  );
}

function BlockSkeleton({ block }) {
  return (
    <>
      {block.tag && <span className="bb-tag">{block.tag}</span>}
      {block.sprite && <img className="pixelated-pet bb-sprite" src={SPRITES.idle_1} alt="" />}
      {block.lines.map((w, i) => (
        <span
          key={i}
          className="bb-line"
          style={{ width: `${w * 100}%`, ...(block.small ? null : { top: 30 + i * 18, height: i === 1 ? 14 : 8 }) }}
        />
      ))}
      {block.chart && <Glyph type={block.chart} />}
    </>
  );
}

/**
 * Hiệu ứng "Heo AI dựng web": con trỏ lướt rất nhanh, kéo-vẽ và kéo-thả nhân bản từng element
 * (header, logo, tab, KPI, banner + nút, 4 biểu đồ), thả linh vật và ghim nút "xem lại intro",
 * rồi mờ dần để lộ ứng dụng thật. Dùng cho cả lần đăng nhập và nút "Xem lại intro".
 */
export function BuildSequence({ onDone }) {
  const reduced = usePrefersReducedMotion();
  const [scope, animate] = useAnimate();
  const [log, setLog] = useState([]);
  const { W, blocks, pet, replay } = useMemo(() => computeLayout(window.innerWidth, window.innerHeight), []);

  useEffect(() => {
    let cancelled = false;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      onDone();
    };

    if (reduced) {
      finish();
      return undefined;
    }

    // Mọi animation đi qua run(): chuỗi đã hủy (Esc / StrictMode) không còn tác động lên phần tử
    const run = (...args) => (cancelled ? Promise.resolve() : animate(...args));
    const cursor = '.build-cursor';
    const el = (id) => `[data-block="${id}"]`;
    let seq = 0;
    const pushLog = (text) => {
      if (cancelled) return;
      seq += 1;
      setLog((l) => [...l.slice(-2), { text, ok: false, key: `${seq}-${text}` }]);
    };
    const markLastOk = () => {
      if (!cancelled) setLog((l) => l.map((r, i) => (i === l.length - 1 ? { ...r, ok: true } : r)));
    };

    const solidify = (b) => {
      const node = scope.current?.querySelector(el(b.id));
      if (!node) return;
      const css = getComputedStyle(document.documentElement);
      const fill = css.getPropertyValue(FILL_VAR[b.fill] || '--bg-card').trim() || '#FFFFFF';
      const border = b.fill === 'card' || b.fill === 'subtle'
        ? css.getPropertyValue('--border-hairline').trim() || '#E7DED4'
        : fill;
      node.style.borderStyle = 'solid';
      run(node, { borderColor: border, backgroundColor: fill }, { duration: 0.15 });
      const inner = node.querySelectorAll('.bb-line, .bb-glyph, .bb-sprite');
      if (inner.length) run(inner, { opacity: [0, 1] }, { duration: 0.15 });
    };

    const drawBlock = async (b) => {
      if (b.log) pushLog(b.log);
      await run(cursor, { x: b.x, y: b.y }, { duration: T.move, ease: EASE_MOVE });
      await run(el(b.id), { x: b.x, y: b.y, width: 0, height: 0, opacity: 1 }, { duration: 0 });
      await Promise.all([
        run(el(b.id), { width: b.w, height: b.h }, { duration: T.draw, ease: EASE_DRAW }),
        run(cursor, { x: b.x + b.w - 4, y: b.y + b.h - 4 }, { duration: T.draw, ease: EASE_DRAW })
      ]);
      solidify(b);
      if (b.click) {
        run(el(b.id), { scale: [1, 1.1, 1] }, { duration: 0.16 });
        await run(cursor, { scale: [1, 0.78, 1] }, { duration: 0.14 });
      }
      if (b.log) markLastOk();
    };

    const copyBlock = async (b, src) => {
      if (b.log) pushLog(b.log);
      const gx = src.x + src.w * 0.5;
      const gy = src.y + src.h * 0.45;
      await run(cursor, { x: gx, y: gy }, { duration: T.grab, ease: EASE_MOVE });
      await run(el(b.id), { x: src.x, y: src.y, width: src.w, height: src.h, opacity: 1, scale: 1.04 }, { duration: 0 });
      solidify(b);
      await Promise.all([
        run(el(b.id), { x: b.x, y: b.y, scale: 1 }, { duration: T.drag, ease: EASE_MOVE }),
        run(cursor, { x: b.x + gx - src.x, y: b.y + gy - src.y }, { duration: T.drag, ease: EASE_MOVE })
      ]);
      if (b.log) markLastOk();
    };

    const dropPet = async () => {
      pushLog('thả linh vật heo ở góc trái');
      await run(cursor, { x: pet.x + pet.size * 0.55, y: pet.y - 6 }, { duration: 0.12, ease: EASE_MOVE });
      await run('.build-pet', { opacity: 1, y: [-80, 0, -10, 0] }, { duration: 0.4, ease: 'easeOut', times: [0, 0.5, 0.75, 1] });
      markLastOk();
    };

    (async () => {
      setLog([]);
      await run(scope.current, { opacity: [0, 1] }, { duration: 0.15 });
      const cx = W * 0.5;
      await run(cursor, { x: cx, y: window.innerHeight * 0.4, opacity: 1 }, { duration: 0 });
      pushLog('khởi động Heo AI...');
      await run(cursor, { x: cx - 30, y: window.innerHeight * 0.3 }, { duration: 0.15, ease: EASE_MOVE });
      markLastOk();

      const byId = Object.fromEntries(blocks.map((b) => [b.id, b]));
      for (const b of blocks) {
        if (cancelled) return;
        if (b.kind === 'copy') await copyBlock(b, byId[b.copyOf]);
        else await drawBlock(b);
      }
      if (cancelled) return;
      await dropPet();
      if (cancelled) return;
      await drawBlock(replay);
      if (cancelled) return;
      pushLog('hoàn tất · đổ dữ liệu thật');
      markLastOk();
      await run(cursor, { x: replay.x + replay.w * 0.5, y: replay.y + replay.h * 0.5, opacity: 0 }, { duration: 0.22, ease: EASE_MOVE });
      if (cancelled) return;
      await run(scope.current, { opacity: 0 }, { duration: 0.3, ease: [0.4, 0, 1, 1] });
      if (!cancelled) finish();
    })();

    const onKey = (e) => { if (e.key === 'Escape') finish(); };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelled = true;
      window.removeEventListener('keydown', onKey);
      scope.animations?.forEach((a) => a.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  if (reduced) return null;

  return (
    <div className="build-overlay" ref={scope} aria-label="Đang dựng giao diện" role="status">
      <div className="build-frame">
        {[...blocks, replay].map((b) => (
          <div key={b.id} className={`build-block ${b.small ? 'small' : ''}`} data-block={b.id}>
            <BlockSkeleton block={b} />
          </div>
        ))}
        <img
          className="pixelated-pet build-pet"
          src={SPRITES.happy_1}
          alt=""
          width={pet.size}
          height={pet.size}
          style={{ left: pet.x, top: pet.y }}
        />
        <div className="build-cursor" style={{ opacity: 0 }}>
          <CursorArrow />
          <span className="cursor-label">
            <img className="pixelated-pet" src={SPRITES.idle_1} alt="" />
            Heo AI
          </span>
        </div>
      </div>

      <div className="build-log" aria-live="polite">
        {log.map((r) => (
          <motion.div key={r.key} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.12 }}>
            <span className={r.ok ? 'ok' : ''}>{r.ok ? '✓' : '›'}</span> {r.text}
            {!r.ok && <span className="typing-caret" />}
          </motion.div>
        ))}
      </div>

      <button type="button" className="btn btn-secondary btn-sm build-skip" onClick={() => onDone()}>
        Bỏ qua (Esc)
      </button>
    </div>
  );
}
