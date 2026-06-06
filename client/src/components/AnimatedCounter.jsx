import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

export default function AnimatedCounter({ value = 0 }) {
  const spring = useSpring(0, { stiffness: 80, damping: 18 });
  const rounded = useTransform(spring, (latest) => Intl.NumberFormat('en', { notation: 'compact' }).format(Math.round(latest)));

  useEffect(() => {
    spring.set(Number(value) || 0);
  }, [spring, value]);

  return <motion.span>{rounded}</motion.span>;
}
