import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

/** Nút nổi góc phải dưới: phát lại intro "Heo AI dựng web". */
export function ReplayIntroButton({ isVisible, onClick }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          type="button"
          className="replay-intro-btn"
          onClick={onClick}
          aria-label="Xem lại intro"
          title="Xem lại intro"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
        >
          <svg className="replay-icon" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 2.5a5.5 5.5 0 1 1-5.2 3.7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M2 2.2v4h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="replay-label-full">Xem lại intro</span>
          <span className="replay-label-short">Intro</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
