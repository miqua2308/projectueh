import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { SPRITES } from '../pet/sprites.js';
import { usePetAnimation, usePrefersReducedMotion } from '../pet/petController.js';
import { PetSprite } from './SavingsPet.jsx';

const COIN_FRAMES = [1, 2, 3, 4, 5, 6].map((n) => SPRITES[`coin_${n}`]);

function SpinningCoin({ size = 36, delay = 0, style }) {
  const reduced = usePrefersReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced) return undefined;
    const t = setInterval(() => setI((n) => (n + 1) % COIN_FRAMES.length), 110);
    return () => clearInterval(t);
  }, [reduced]);
  return (
    <motion.img
      className="pixelated-pet login-coin"
      src={COIN_FRAMES[i]}
      alt=""
      aria-hidden="true"
      width={size * 0.9}
      height={size}
      style={style}
      initial={{ opacity: 0, y: 12 }}
      animate={reduced ? { opacity: 1, y: 0 } : { opacity: 1, y: [0, -10, 0] }}
      transition={reduced ? { duration: 0.3 } : { opacity: { delay, duration: 0.4 }, y: { delay, duration: 3.2, repeat: Infinity, ease: 'easeInOut' } }}
    />
  );
}

/** Trang đăng nhập demo: chỉ 1 nút LOG IN, bấm là vào. */
export function LoginScreen({ onLogin, theme, onToggleTheme }) {
  const pet = usePetAnimation({ stage: 1, isSad: false });
  const [pressed, setPressed] = useState(false);

  const handleLogin = () => {
    if (pressed) return;
    setPressed(true);
    pet.play('happy');
    setTimeout(onLogin, 380);
  };

  return (
    <motion.main
      className="login-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
    >
      <div className="login-brand">
        <span className="brand-mark"><img className="pixelated-pet" src={SPRITES.idle_1} alt="" width={32} height={32} /></span>
        <strong>SmartFinance</strong>
      </div>
      <button type="button" className="icon-btn login-theme" onClick={onToggleTheme}>
        {theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
      </button>

      <SpinningCoin size={40} delay={0.2} style={{ left: '14%', top: '24%' }} />
      <SpinningCoin size={30} delay={0.6} style={{ right: '16%', top: '32%' }} />
      <SpinningCoin size={34} delay={1.0} style={{ left: '22%', bottom: '20%' }} />
      <SpinningCoin size={26} delay={1.3} style={{ right: '24%', bottom: '26%' }} />

      <motion.div
        className="login-center"
        animate={pressed ? { scale: 0.94, opacity: 0, y: -8 } : { scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.4, 0, 1, 1], delay: pressed ? 0.12 : 0 }}
      >
        <motion.div
          className="login-pet"
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 18, delay: 0.1 }}
        >
          <PetSprite src={pet.src} size={128} alt="Heo đất SmartFinance" />
          <div className="pet-shadow" aria-hidden="true" />
        </motion.div>

        <motion.button
          type="button"
          className={`login-btn ${pressed ? 'pressed' : ''}`}
          onClick={handleLogin}
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.2, 0, 0, 1], delay: 0.25 }}
          autoFocus
        >
          <img className="pixelated-pet btn-coin" src={SPRITES.coin_1} alt="" aria-hidden="true" />
          LOG IN
        </motion.button>
      </motion.div>

      <p className="login-hint">Bản demo · không cần tài khoản hay mật khẩu</p>
    </motion.main>
  );
}
