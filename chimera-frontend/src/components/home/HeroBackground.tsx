'use client';

import { motion } from 'framer-motion';

const orbs = [
  {
    size: 500,
    gradient: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
    x: [0, 100, -50],
    y: [0, -80, 60],
    duration: 12,
  },
  {
    size: 400,
    gradient: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
    x: [-80, 60, -30],
    y: [50, -100, 20],
    duration: 15,
  },
  {
    size: 350,
    gradient: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
    x: [40, -60, 80],
    y: [-30, 70, -50],
    duration: 8,
  },
  {
    size: 300,
    gradient: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)',
    x: [-50, 80, -20],
    y: [80, -40, -80],
    duration: 18,
  },
];

export function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            background: orb.gradient,
            top: `${20 + i * 15}%`,
            left: `${10 + i * 20}%`,
          }}
          animate={{ x: orb.x, y: orb.y }}
          transition={{
            repeat: Infinity,
            repeatType: 'reverse',
            duration: orb.duration,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
