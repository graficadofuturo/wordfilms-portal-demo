import React from 'react';
import { motion } from 'motion/react';

export const AnimatedBackground: React.FC<{ isVisible?: boolean }> = ({ isVisible = true }) => {
  // Configurações para as "manchas" (blobs) monocromáticas e fluídas - Mais aleatórias e contidas
  const blobs = [
    {
      id: 1,
      size: 'w-[100vw] h-[100vw] md:w-[60vw] md:h-[60vw]',
      color: 'bg-white/20 md:bg-white/10',
      top: '-5%',
      left: '10%',
      initial: { x: '0%', y: '0%', scale: 1 },
      animate: {
        x: ['0%', '40%', '-20%', '30%', '10%', '-5%'],
        y: ['0%', '25%', '40%', '-15%', '10%', '0%'],
        scale: [1, 1.2, 0.8, 1.1, 0.9, 1],
      },
      duration: 20,
    },
    {
      id: 2,
      size: 'w-[100vw] h-[100vw] md:w-[50vw] md:h-[50vw]',
      color: 'bg-zinc-300/20',
      top: '20%',
      left: '60%',
      initial: { x: '0%', y: '0%', scale: 1 },
      animate: {
        x: ['0%', '-50%', '30%', '-20%', '15%', '0%'],
        y: ['0%', '40%', '-30%', '25%', '-10%', '0%'],
        scale: [1, 0.7, 1.2, 0.9, 1.1, 1],
      },
      duration: 25,
    },
    {
      id: 3,
      size: 'w-[100vw] h-[100vw] md:w-[70vw] md:h-[70vw]',
      color: 'bg-zinc-500/15 md:bg-zinc-500/10',
      top: '40%',
      left: '-10%',
      initial: { x: '0%', y: '0%', scale: 1 },
      animate: {
        x: ['0%', '35%', '-25%', '20%', '-10%', '0%'],
        y: ['0%', '-30%', '45%', '15%', '-20%', '0%'],
        scale: [1, 1.3, 0.8, 1.1, 0.9, 1],
      },
      duration: 30,
    },
    {
      id: 4,
      size: 'w-[110vw] h-[110vw] md:w-[55vw] md:h-[55vw]',
      color: 'bg-zinc-700/20 md:bg-zinc-700/25',
      top: '70%',
      left: '40%',
      initial: { x: '0%', y: '0%', scale: 1 },
      animate: {
        x: ['0%', '-45%', '25%', '-15%', '10%', '0%'],
        y: ['0%', '35%', '-25%', '20%', '-10%', '0%'],
        scale: [1, 1.1, 0.7, 1.2, 0.9, 1],
      },
      duration: 28,
    },
    {
      id: 5,
      size: 'w-[100vw] h-[100vw] md:w-[65vw] md:h-[65vw]',
      color: 'bg-white/20 md:bg-white/10',
      top: '10%',
      left: '20%',
      initial: { x: '0%', y: '0%', scale: 1 },
      animate: {
        x: ['0%', '25%', '-35%', '15%', '-10%', '0%'],
        y: ['0%', '45%', '-20%', '30%', '-10%', '0%'],
        scale: [1, 0.9, 1.3, 1, 1.1, 1],
      },
      duration: 35,
    },
    {
      id: 10,
      size: 'w-[100vw] h-[100vw] md:w-[60vw] md:h-[60vw]',
      color: 'bg-zinc-400/20',
      top: '55%',
      left: '70%',
      initial: { x: '0%', y: '0%', scale: 1 },
      animate: {
        x: ['0%', '-40%', '30%', '-20%', '10%', '0%'],
        y: ['0%', '30%', '-25%', '15%', '-5%', '0%'],
        scale: [1, 0.8, 1.2, 0.9, 1.1, 1],
      },
      duration: 26,
    },
    {
      id: 11,
      size: 'w-[110vw] h-[110vw] md:w-[55vw] md:h-[55vw]',
      color: 'bg-zinc-200/15 md:bg-zinc-200/10',
      top: '65%',
      left: '-15%',
      initial: { x: '0%', y: '0%', scale: 1 },
      animate: {
        x: ['0%', '35%', '-20%', '25%', '-10%', '0%'],
        y: ['0%', '-30%', '40%', '-15%', '10%', '0%'],
        scale: [1, 1.1, 0.7, 1.2, 0.9, 1],
      },
      duration: 32,
    },
    {
      id: 6,
      size: 'w-[100vw] h-[100vw] md:w-[60vw] md:h-[60vw]',
      color: 'bg-zinc-400/20',
      top: '85%',
      left: '5%',
      initial: { x: '0%', y: '0%', scale: 1 },
      animate: {
        x: ['0%', '30%', '-25%', '15%', '-10%', '0%'],
        y: ['0%', '-20%', '30%', '10%', '-15%', '0%'],
        scale: [1, 1.2, 0.9, 1.1, 0.8, 1],
      },
      duration: 28,
    },
    {
      id: 7,
      size: 'w-[110vw] h-[110vw] md:w-[55vw] md:h-[55vw]',
      color: 'bg-zinc-600/15 md:bg-zinc-600/20',
      top: '95%',
      left: '50%',
      initial: { x: '0%', y: '0%', scale: 1 },
      animate: {
        x: ['0%', '-35%', '20%', '-20%', '10%', '0%'],
        y: ['0%', '25%', '-30%', '15%', '-10%', '0%'],
        scale: [1, 0.8, 1.1, 0.9, 1.2, 1],
      },
      duration: 31,
    },
    {
      id: 8,
      size: 'w-[100vw] h-[100vw] md:w-[70vw] md:h-[70vw]',
      color: 'bg-white/20 md:bg-white/10',
      top: '110%',
      left: '15%',
      initial: { x: '0%', y: '0%', scale: 1 },
      animate: {
        x: ['0%', '25%', '-20%', '30%', '-15%', '0%'],
        y: ['0%', '30%', '-25%', '15%', '-10%', '0%'],
        scale: [1, 1.1, 0.8, 1.2, 0.9, 1],
      },
      duration: 36,
    },
    {
      id: 9,
      size: 'w-[100vw] h-[100vw] md:w-[50vw] md:h-[50vw]',
      color: 'bg-zinc-800/15 md:bg-zinc-800/30',
      top: '125%',
      left: '60%',
      initial: { x: '0%', y: '0%', scale: 1 },
      animate: {
        x: ['0%', '-30%', '25%', '-15%', '10%', '0%'],
        y: ['0%', '-25%', '20%', '10%', '-15%', '0%'],
        scale: [1, 0.9, 1.2, 1, 1.1, 1],
      },
      duration: 31,
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 2, ease: "easeOut" }}
      className="absolute inset-0 h-full z-0 overflow-hidden pointer-events-none"
    >
      {/* Camada de Brilho em Movimento (Blobs) com Máscara de Pontos Estática */}
      <div 
        className="absolute inset-0 blur-[40px] opacity-60 md:opacity-50"
        style={{
          maskImage: 'radial-gradient(circle, black 1.2px, transparent 1.2px)',
          WebkitMaskImage: 'radial-gradient(circle, black 1.2px, transparent 1.2px)',
          maskSize: '16px 16px',
          WebkitMaskSize: '16px 16px'
        }}
      >
        {blobs.map((blob) => (
          <motion.div
            key={blob.id}
            initial={blob.initial}
            animate={isVisible ? blob.animate : blob.initial}
            transition={{
              duration: blob.duration,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
            className={`absolute rounded-full ${blob.size} ${blob.color}`}
            style={{ top: blob.top, left: blob.left }}
          />
        ))}
      </div>
    </motion.div>
  );
};