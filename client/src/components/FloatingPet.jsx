import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PetSprite } from './SavingsPet.jsx';

const BUBBLE_MAX = 60;

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(dateStr) - today) / 86400000);
}

/** Thông điệp ≤60 ký tự: ưu tiên hạn mức vượt, rồi gói sắp hết hạn. */
export function buildPetMessage(budgets = [], subscriptions = []) {
  let msg = 'Tài chính ổn định, giữ vững kỷ luật nhé!';
  const breached = budgets.find((b) => b.status === 'EXCEEDED_100');
  const near = budgets.find((b) => b.status === 'WARNING_80');
  const urgent = subscriptions.find((s) => s.status === 'ACTIVE' && daysUntil(s.nextDate) >= 0 && daysUntil(s.nextDate) <= 3);
  if (breached) msg = `${breached.categoryName} đã vượt hạn mức!`;
  else if (urgent) msg = `Gói ${urgent.name} hết hạn sau ${daysUntil(urgent.nextDate)} ngày`;
  else if (near) msg = `${near.categoryName} đã dùng ${near.percentage}% hạn mức`;
  return msg.length > BUBBLE_MAX ? `${msg.slice(0, BUBBLE_MAX - 1)}…` : msg;
}

function useIsSmallScreen() {
  const query = '(max-width: 599px)';
  const [small, setSmall] = useState(() => {
    try { return window.matchMedia(query).matches; } catch { return false; }
  });
  useEffect(() => {
    let mq;
    try { mq = window.matchMedia(query); } catch { return undefined; }
    const onChange = (e) => setSmall(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return small;
}

export function FloatingPet({ petAnim, budgets, subscriptions, isVisible, activeTab }) {
  const [bubbleState, setBubbleState] = useState(null);
  const small = useIsSmallScreen();
  const bubble = bubbleState?.text || '';
  const setBubble = (text) => setBubbleState({ text, id: Date.now() });

  useEffect(() => {
    if (!bubbleState) return undefined;
    const t = setTimeout(() => setBubbleState(null), 3000);
    return () => clearTimeout(t);
  }, [bubbleState]);

  const show = isVisible && activeTab !== 'pet';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          id="floatingPetWidget"
          className="floating-pet"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
        >
          <AnimatePresence>
            {bubble && (
              <motion.div
                key={bubble}
                className="floating-speech-bubble"
                role="status"
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.18 }}
              >
                {bubble}
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button
            type="button"
            className="floating-pet-btn"
            aria-label="Tương tác với pet"
            title="Bấm để tương tác với pet"
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              petAnim.play('happy');
              setBubble(buildPetMessage(budgets, subscriptions));
            }}
          >
            <PetSprite src={petAnim.src} size={small ? 64 : 96} alt="Pet nổi" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
