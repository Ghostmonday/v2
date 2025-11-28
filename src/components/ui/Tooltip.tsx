/**
 * Educational Tooltip Component
 * Reusable tooltip with "?" icon trigger
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ title, description, position = 'top' }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[10px] text-[var(--text-tertiary)] hover:text-white transition-colors"
      >
        ?
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 5 : -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`
              absolute z-[9999] ${positionClasses[position]}
              w-[280px] p-3 rounded-lg
              glass-card-elevated
              pointer-events-none
            `}
          >
            <div className="text-xs font-bold text-white mb-1">{title}</div>
            <div className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              {description}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

