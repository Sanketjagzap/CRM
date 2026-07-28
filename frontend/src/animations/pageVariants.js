export const pageVariants = {
  initial: { opacity: 0, y: 18, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -10, filter: 'blur(8px)', transition: { duration: 0.18 } },
};