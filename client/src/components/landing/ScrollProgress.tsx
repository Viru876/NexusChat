import { motion, useScroll, useSpring } from 'framer-motion';

/**
 * Thin gradient progress bar fixed to the top of the viewport, reflecting
 * how far the user has scrolled down the landing page.
 */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed left-0 top-0 z-[60] h-[3px] w-full origin-left bg-gradient-brand"
    />
  );
}
