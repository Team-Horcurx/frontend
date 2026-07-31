import React from 'react';
import { motion } from 'framer-motion';

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
};

export default function PageMotion({ className, children }) {
  return (
    <motion.div className={className} {...pageTransition}>
      {children}
    </motion.div>
  );
}
