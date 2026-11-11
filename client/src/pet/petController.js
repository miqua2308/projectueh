import { useState, useEffect, useRef, useCallback } from 'react';
import { SPRITES } from './sprites.js';

export const PET_STAGES = [
  { level: 1, name: 'Heo Con', minXp: 0 },
  { level: 2, name: 'Heo Teen', minXp: 300 },
  { level: 3, name: 'Heo Phú Quý', minXp: 700 },
  { level: 4, name: 'Heo Vàng', minXp: 1400 },
  { level: 5, name: 'Heo Thần Tài', minXp: 2400 }
];

export function getPetStage(xp = 0) {
  for (let i = PET_STAGES.length - 1; i >= 0; i--) {
    if (xp >= PET_STAGES[i].minXp) return PET_STAGES[i];
  }
  return PET_STAGES[0];
}

// Cấu hình hoạt ảnh: số khung, tốc độ, có lặp hay không
export const ANIMATIONS = {
  idle: { frames: 4, ms: 500, loop: true },
  sad: { frames: 2, ms: 500, loop: true },
  happy: { frames: 4, ms: 500, loop: false },
  eat: { frames: 4, ms: 500, loop: false },
  evolve: { frames: 3, ms: 300, loop: false }
};

export function spriteKey(stage, action, frame) {
  return `${stage === 1 ? '' : `s${stage}_`}${action}_${frame}`;
}

/** Khung thiếu -> fallback idle_1 của stage hiện tại (không báo lỗi). */
export function getSpriteSrc(stage, action = 'idle', frame = 1) {
  return SPRITES[spriteKey(stage, action, frame)]
    || SPRITES[spriteKey(stage, 'idle', 1)]
    || SPRITES.idle_1;
}

export function usePrefersReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => {
    try { return window.matchMedia(query).matches; } catch { return false; }
  });
  useEffect(() => {
    let mq;
    try { mq = window.matchMedia(query); } catch { return undefined; }
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

let shotId = 0;

/**
 * Bộ điều khiển hoạt ảnh dùng chung cho pet trong tab và pet nổi.
 * - Lặp idle (4 khung, 500ms); lặp sad khi isSad.
 * - play('eat' | 'happy') phát một lần rồi quay về vòng lặp nền.
 * - Khi stage tăng: phát evolve (3 khung, 300ms) trên stage cũ rồi đổi sang stage mới.
 * - prefers-reduced-motion: chỉ hiện khung tĩnh idle_1.
 */
export function usePetAnimation({ stage = 1, isSad = false }) {
  const reduced = usePrefersReducedMotion();
  const [displayStage, setDisplayStage] = useState(stage);
  const [queue, setQueue] = useState([]);
  const [frame, setFrame] = useState(1);
  const stageRef = useRef(stage);
  stageRef.current = stage;

  // Phát hiện tiến hóa / tụt cấp
  useEffect(() => {
    if (stage > displayStage) {
      setQueue((q) => (q.some((s) => s.action === 'evolve') ? q : [...q, { action: 'evolve', id: ++shotId }]));
    } else if (stage < displayStage) {
      setDisplayStage(stage);
    }
  }, [stage, displayStage]);

  const current = queue[0];
  const action = current?.action || (isSad ? 'sad' : 'idle');

  const finishShot = useCallback((shot) => {
    if (shot?.action === 'evolve') setDisplayStage(stageRef.current);
    setQueue((q) => (q[0] === shot ? q.slice(1) : q));
  }, []);

  useEffect(() => {
    setFrame(1);
    if (reduced) {
      if (current) finishShot(current);
      return undefined;
    }
    const cfg = ANIMATIONS[action];
    let n = 1;
    const timer = setInterval(() => {
      n += 1;
      if (n > cfg.frames) {
        if (cfg.loop) {
          n = 1;
        } else {
          clearInterval(timer);
          finishShot(current);
          return;
        }
      }
      setFrame(n);
    }, cfg.ms);
    return () => clearInterval(timer);
  }, [action, current, reduced, finishShot]);

  const play = useCallback((name) => {
    if (!ANIMATIONS[name] || ANIMATIONS[name].loop || name === 'evolve') return;
    setQueue((q) => {
      const shot = { action: name, id: ++shotId };
      if (q.length === 0) return [shot];
      // giữ khung đang phát + các evolve đang chờ, thay hành động thường cuối hàng
      return [q[0], ...q.slice(1).filter((s) => s.action === 'evolve'), shot].slice(0, 3);
    });
  }, []);

  const shownAction = reduced ? 'idle' : action;
  const shownFrame = reduced ? 1 : frame;

  return {
    src: getSpriteSrc(displayStage, shownAction, shownFrame),
    action: shownAction,
    frame: shownFrame,
    displayStage,
    isEvolving: action === 'evolve',
    play
  };
}
