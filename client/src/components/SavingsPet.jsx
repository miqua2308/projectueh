import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { formatVND } from '../utils/formatters.js';
import { PET_STAGES, getPetStage, getSpriteSrc } from '../pet/petController.js';

export { PET_STAGES, getPetStage };

const BUBBLE_MAX = 60;
const clip = (s) => (s.length > BUBBLE_MAX ? `${s.slice(0, BUBBLE_MAX - 1)}…` : s);

/** Ảnh pet pixel: kích thước luôn là bội số nguyên của 32. */
export function PetSprite({ src, size = 128, alt = 'Linh vật heo đất', className = '', ...rest }) {
  return (
    <img
      className={`pixelated-pet ${className}`}
      src={src}
      alt={alt}
      width={size}
      height={size}
      draggable={false}
      {...rest}
    />
  );
}

function useBubble() {
  const [bubble, setBubble] = useState(null);
  useEffect(() => {
    if (!bubble) return undefined;
    const t = setTimeout(() => setBubble(null), 3000);
    return () => clearTimeout(t);
  }, [bubble]);
  return [bubble?.text || '', (msg) => setBubble({ text: clip(msg), id: Date.now() })];
}

function XpBar({ xp, stage }) {
  const next = PET_STAGES[stage.level];
  const pct = next ? Math.min(100, Math.round(((xp - stage.minXp) / (next.minXp - stage.minXp)) * 100)) : 100;
  return (
    <div className="xp-block">
      <div className="xp-row">
        <span>{next ? `Tới ${next.name}` : 'Cấp tối đa'}</span>
        <span className="num-tabular pixel-font">{next ? `${xp} / ${next.minXp} XP` : `${xp} XP`}</span>
      </div>
      <div className="xp-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <motion.div
          className="xp-fill"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
        />
      </div>
    </div>
  );
}

function GoalForm({ onCreate, onCancel }) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (!name || !target) return;
    onCreate({ name, target: Number(target) });
  };
  return (
    <motion.form
      onSubmit={submit}
      className="goal-form"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
    >
      <input className="form-input" placeholder="Tên mục tiêu..." value={name} onChange={(e) => setName(e.target.value)} required />
      <input type="number" min="1" className="form-input" placeholder="Số tiền cần đạt (VND)" value={target} onChange={(e) => setTarget(e.target.value)} required />
      <button type="submit" className="btn btn-sm">Tạo (+50 XP)</button>
      <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>Hủy</button>
    </motion.form>
  );
}

function GoalCard({ goal, onDeposit }) {
  const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
  return (
    <motion.div className="goal-card" layout whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <div className="goal-head">
        <strong>{goal.name}</strong>
        <span className="goal-pct-badge num-tabular">{pct}%</span>
      </div>
      <div className="progress-track" style={{ height: '6px' }}>
        <motion.div
          className="progress-bar"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
          style={{ background: pct >= 100 ? 'var(--color-income)' : 'var(--ocean-600)' }}
        />
      </div>
      <div className="goal-foot num-tabular">
        <span>Có: {formatVND(goal.current)}</span>
        <span>Mục tiêu: {formatVND(goal.target)}</span>
      </div>
      <div style={{ marginTop: '0.6rem', textAlign: 'right' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => onDeposit(goal)}>+ Nạp quỹ (+50 XP)</button>
      </div>
    </motion.div>
  );
}

function EvolutionRoadmap({ xp, currentStage }) {
  return (
    <div className="metric-card" style={{ marginTop: '1.25rem' }}>
      <div className="metric-eyebrow">
        <span>Lộ trình tiến hóa 5 giai đoạn</span>
        <span className="muted-note">Cấp hiện tại: {currentStage.name} · {xp} XP</span>
      </div>
      <div className="roadmap-grid">
        {PET_STAGES.map((st, i) => {
          const unlocked = xp >= st.minXp;
          const isCurrent = currentStage.level === st.level;
          return (
            <motion.div
              key={st.level}
              className={`roadmap-step ${isCurrent ? 'current' : ''} ${unlocked ? '' : 'locked'}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <PetSprite src={getSpriteSrc(st.level, 'idle', 1)} size={64} alt={st.name} />
              <div className="roadmap-name">{st.name}</div>
              <div className="roadmap-meta pixel-font">LV.{st.level} · {st.minXp} XP {unlocked ? '✓' : '🔒'}</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function SavingsPet({
  pet,
  petAnim,
  onAddXp,
  budgets = [],
  netBalance = 0,
  month,
  goals = [],
  onAddGoal,
  onDepositGoal,
  isFloatingPetEnabled,
  onToggleFloatingPet
}) {
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [bubble, say] = useBubble();

  const xp = pet?.xp || 0;
  const currentStage = getPetStage(xp);
  const isSad = budgets.some((b) => b.status === 'EXCEEDED_100') || netBalance < 0;
  const { src, play, isEvolving } = petAnim;

  const handleFeed = () => {
    play('eat');
    onAddXp(50);
    const nextStage = getPetStage(xp + 50);
    say(nextStage.level > currentStage.level ? `Tiến hóa! Pet đã thành ${nextStage.name}!` : 'Măm măm! Đã nạp tiết kiệm (+50 XP)');
  };

  const handleMonthlyReward = () => {
    if (isSad) {
      say('Có danh mục vượt hạn mức, chưa nhận thưởng được');
      return;
    }
    play('happy');
    onAddXp(150);
    say(`Kỷ luật tháng ${month}: +150 XP!`);
  };

  const handleCreateGoal = ({ name, target }) => {
    onAddGoal({ id: Date.now(), name, target, current: 0, color: '#0284c7' });
    setIsAddingGoal(false);
    play('happy'); // addGoal đã cộng +50 XP
    say(`Đã tạo mục tiêu "${name}"`);
  };

  const handleDeposit = (goal) => {
    const str = window.prompt(`Nạp thêm tiền vào quỹ "${goal.name}" (VND):`, '500000');
    const amount = Number(str);
    if (!str || !(amount > 0)) return;
    onDepositGoal(goal.id, amount); // depositGoal đã cộng +50 XP
    if (goal.current < goal.target && goal.current + amount >= goal.target) {
      play('happy');
      say(`Đạt mốc! Quỹ "${goal.name}" đã đủ 100%`);
    } else {
      play('eat');
      say(`Nạp ${formatVND(amount)} vào quỹ (+50 XP)`);
    }
  };

  return (
    <div className="pet-container">
      <div className="pet-tab-card">
        <div className="pet-tab-toolbar">
          <label className="switch-wrap">
            <input type="checkbox" checked={isFloatingPetEnabled} onChange={(e) => onToggleFloatingPet(e.target.checked)} />
            <span className="switch-slider" />
            <span className="switch-label">Hiện pet ở góc màn hình</span>
          </label>
        </div>

        <div className="pet-stage-area">
          <AnimatePresence>
            {bubble && (
              <motion.div
                key={bubble}
                className="pet-speech-bubble"
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                role="status"
              >
                {bubble}
              </motion.div>
            )}
          </AnimatePresence>
          <button
            type="button"
            className={`pet-tab-sprite-box ${isEvolving ? 'evolving' : ''}`}
            onClick={() => { play('happy'); say(isSad ? 'Hơi lo… có khoản vượt hạn mức' : 'Hihi, nhột quá!'); }}
            title="Bấm vào pet để vuốt ve"
          >
            <PetSprite src={src} size={128} />
          </button>
          <div className="pet-shadow" aria-hidden="true" />
        </div>

        <div className="pet-identity">
          <span className="pixel-font pet-level">LV.{currentStage.level}</span>
          <h3>{currentStage.name}</h3>
          <span className={`mood-tag ${isSad ? 'sad' : 'happy'}`}>
            {isSad ? 'Lo lắng · có danh mục vượt hạn mức' : 'Vui vẻ · chi tiêu trong hạn mức'}
          </span>
        </div>

        <XpBar xp={xp} stage={currentStage} />

        <div className="pet-actions">
          <motion.button className="btn" whileTap={{ scale: 0.96 }} onClick={handleFeed}>
            Cho ăn · nạp tiền tiết kiệm (+50 XP)
          </motion.button>
          <button className="btn btn-secondary" onClick={() => setIsAddingGoal(true)}>Đặt mục tiêu quỹ</button>
          <button className="btn btn-secondary" onClick={handleMonthlyReward}>Thưởng kỷ luật {month}</button>
        </div>
      </div>

      <div className="metric-card" style={{ marginTop: '1.25rem' }}>
        <div className="metric-eyebrow">
          <span>Mục tiêu tiết kiệm nuôi pet</span>
          {!isAddingGoal && (
            <button className="btn-link" onClick={() => setIsAddingGoal(true)}>+ Thêm mục tiêu</button>
          )}
        </div>
        <AnimatePresence>
          {isAddingGoal && <GoalForm onCreate={handleCreateGoal} onCancel={() => setIsAddingGoal(false)} />}
        </AnimatePresence>
        <div className="goals-grid" style={{ marginTop: '0.75rem' }}>
          {goals.map((g) => <GoalCard key={g.id} goal={g} onDeposit={handleDeposit} />)}
        </div>
      </div>

      <EvolutionRoadmap xp={xp} currentStage={currentStage} />
    </div>
  );
}
