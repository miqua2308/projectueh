import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useAnimate } from 'motion/react';
import { SPRITES } from '../pet/sprites.js';
import { usePrefersReducedMotion } from '../pet/petController.js';

const EASE_MOVE = [0.65, 0, 0.25, 1]; // con trỏ: tăng tốc rồi hãm gấp – cảm giác "máy" thao tác nhanh
const EASE_DRAW = [0.2, 0, 0, 1];
const GAP = 14;

function computeLayout(vw, vh) {
  const W = Math.min(1200, vw - 32);
  const narrow = W < 720;
  const blocks = [
    { id: 'header', tag: '<Header />', log: 'dựng thanh tiêu đề', x: 0, y: 0, w: W, h: 64, lines: [0.18, 0.1] },
    { id: 'nav', tag: '<NavTabs />', log: 'thêm thanh điều hướng', x: 0, y: 64 + GAP, w: W, h: 44, lines: [] }
  ];
  const kCols = narrow ? 2 : 4;
  const kw = (W - GAP * (kCols - 1)) / kCols;
  const kh = 96;
  const kTop = 64 + 44 + GAP * 2;
  for (let i = 0; i < 4; i++) {
    blocks.push({
      id: `kpi${i}`,
      tag: '<KpiCard />',
      log: i === 0 ? 'vẽ thẻ KPI' : `nhân bản KPI ${i + 1}/4`,
      copyOf: i === 0 ? null : 'kpi0',
      x: (i % kCols) * (kw + GAP),
      y: kTop + Math.floor(i / kCols) * (kh + GAP),
      w: kw,
      h: kh,
      lines: [0.45, 0.7, 0.35]
    });
  }
  const kRows = Math.ceil(4 / kCols);
  const cTop = kTop + kRows * (kh + GAP);
  const cCols = narrow ? 1 : 2;
  const cw = (W - GAP * (cCols - 1)) / cCols;
  const ch = Math.max(120, Math.min(240, (vh - 48 - cTop - (narrow ? GAP : 0)) / (narrow ? 2 : 1) - 70));
  ['Thu vs Chi', 'Dự báo AI'].forEach((name, i) => {
    blocks.push({
      id: `chart${i}`,
      tag: '<Chart />',
      log: `vẽ biểu đồ ${name}`,
      x: (i % cCols) * (cw + GAP),
      y: cTop + Math.floor(i / cCols) * (ch + GAP),
      w: cw,
      h: ch,
      lines: [0.3],
      chart: true
    });
  });
  return { W, blocks };
}

function CursorArrow() {
  return (
    <svg width="22" height="26" viewBox="0 0 22 26" aria-hidden="true">
      <path d="M2 1.5 L2 21 L7.2 16.4 L10.6 24 L14 22.5 L10.7 15 L18 15 Z" fill="#2B1E27" stroke="#FFFFFF" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function BlockSkeleton({ block }) {
  return (
    <>
      <span className="bb-tag">{block.tag}</span>
      {block.lines.map((w, i) => (
        <span key={i} className="bb-line" style={{ top: 30 + i * 18, width: `${w * 100}%`, height: i === 1 ? 14 : 8 }} />
      ))}
      {block.chart && (
        <svg className="bb-line" style={{ left: 14, right: 14, top: 48, bottom: 14, width: 'calc(100% - 28px)', height: 'calc(100% - 62px)', background: 'none' }} viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
          <polyline points="0,32 16,26 32,29 48,18 64,21 80,10 100,13" fill="none" stroke="var(--ocean-600)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
        </svg>
      )}
    </>
  );
}

/**
 * Hiệu ứng sau khi đăng nhập: con trỏ "Heo AI" thao tác nhanh, kéo-vẽ và kéo-thả
 * từng khối giao diện như AI đang dựng web, rồi mờ dần để lộ ứng dụng thật.
 */
export function BuildSequence({ onDone }) {
  const reduced = usePrefersReducedMotion();
  const [scope, animate] = useAnimate();
  const [log, setLog] = useState([]);
  const doneRef = useRef(false);
  const { W, blocks } = useMemo(() => computeLayout(window.innerWidth, window.innerHeight), []);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  useEffect(() => {
    if (reduced) {
      finish();
      return undefined;
    }
    let cancelled = false;
    // Mọi animation đi qua run(): chuỗi đã hủy (Esc/StrictMode) không còn tác động lên phần tử
    const run = (...args) => (cancelled ? Promise.resolve() : animate(...args));
    const cursor = '.build-cursor';
    const el = (id) => `[data-block="${id}"]`;
    let seq = 0;
    const pushLog = (text, ok = false) => {
      if (cancelled) return;
      seq += 1;
      setLog((l) => [...l.slice(-2), { text, ok, key: `${seq}-${text}` }]);
    };
    const markLastOk = () => {
      if (!cancelled) setLog((l) => l.map((r, i) => (i === l.length - 1 ? { ...r, ok: true } : r)));
    };

    const solidify = async (b) => {
      const node = scope.current?.querySelector(el(b.id));
      if (!node) return;
      node.style.borderStyle = 'solid';
      const css = getComputedStyle(document.documentElement);
      const border = css.getPropertyValue('--border-hairline').trim() || '#E7DED4';
      const card = css.getPropertyValue('--bg-card').trim() || '#FFFFFF';
      run(node, { borderColor: border, backgroundColor: card }, { duration: 0.2 });
      const lines = node.querySelectorAll('.bb-line');
      if (lines.length) run(lines, { opacity: [0, 1] }, { duration: 0.2 });
    };

    const drawBlock = async (b) => {
      pushLog(b.log);
      await run(cursor, { x: b.x, y: b.y }, { duration: 0.2, ease: EASE_MOVE });
      run(cursor, { scale: 0.86 }, { duration: 0.06 });
      await run(el(b.id), { x: b.x, y: b.y, width: 0, height: 0, opacity: 1 }, { duration: 0 });
      await Promise.all([
        run(el(b.id), { width: b.w, height: b.h }, { duration: 0.26, ease: EASE_DRAW }),
        run(cursor, { x: b.x + b.w - 4, y: b.y + b.h - 4 }, { duration: 0.26, ease: EASE_DRAW })
      ]);
      run(cursor, { scale: 1 }, { duration: 0.08 });
      solidify(b);
      markLastOk();
    };

    const copyBlock = async (b, src) => {
      pushLog(b.log);
      const grabX = src.x + src.w * 0.5;
      const grabY = src.y + src.h * 0.45;
      await run(cursor, { x: grabX, y: grabY }, { duration: 0.16, ease: EASE_MOVE });
      run(cursor, { scale: 0.86 }, { duration: 0.05 });
      await run(el(b.id), { x: src.x, y: src.y, width: src.w, height: src.h, opacity: 1, scale: 1.03 }, { duration: 0 });
      solidify(b);
      await Promise.all([
        run(el(b.id), { x: b.x, y: b.y, scale: 1 }, { duration: 0.24, ease: EASE_MOVE }),
        run(cursor, { x: b.x + grabX - src.x, y: b.y + grabY - src.y }, { duration: 0.24, ease: EASE_MOVE })
      ]);
      run(cursor, { scale: 1 }, { duration: 0.08 });
      markLastOk();
    };

    (async () => {
      setLog([]);
      const startX = W * 0.5;
      await run(cursor, { x: startX, y: window.innerHeight * 0.45, opacity: 1 }, { duration: 0 });
      pushLog('khởi động Heo AI...');
      await run(cursor, { x: startX - 30, y: window.innerHeight * 0.35 }, { duration: 0.25, ease: EASE_MOVE });
      markLastOk();
      const byId = Object.fromEntries(blocks.map((b) => [b.id, b]));
      for (const b of blocks) {
        if (cancelled) return;
        if (b.copyOf) await copyBlock(b, byId[b.copyOf]);
        else await drawBlock(b);
      }
      if (cancelled) return;
      pushLog('hoàn tất · đổ dữ liệu thật', true);
      await run(cursor, { x: W + 40, y: window.innerHeight - 80, opacity: 0 }, { duration: 0.35, ease: EASE_MOVE });
      if (cancelled) return;
      await run(scope.current, { opacity: 0 }, { duration: 0.4, ease: [0.4, 0, 1, 1] });
      if (!cancelled) finish();
    })();

    const onKey = (e) => { if (e.key === 'Escape') finish(); };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelled = true;
      window.removeEventListener('keydown', onKey);
      scope.animations?.forEach((a) => a.stop()); // StrictMode/dev: dừng chuỗi cũ
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  if (reduced) return null;

  return (
    <div className="build-overlay" ref={scope} aria-label="Đang dựng giao diện" role="status">
      <div className="build-frame">
        {blocks.map((b) => (
          <div key={b.id} className="build-block" data-block={b.id}>
            <BlockSkeleton block={b} />
          </div>
        ))}
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
          <motion.div key={r.key} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }}>
            <span className={r.ok ? 'ok' : ''}>{r.ok ? '✓' : '›'}</span> {r.text}{!r.ok && <span className="typing-caret" />}
          </motion.div>
        ))}
      </div>

      <button type="button" className="btn btn-secondary btn-sm build-skip" onClick={finish}>
        Bỏ qua (Esc)
      </button>
    </div>
  );
}
