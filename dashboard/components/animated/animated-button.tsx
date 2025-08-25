'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ButtonProps } from '@/components/ui/button';

interface AnimatedButtonProps extends ButtonProps {
  children: ReactNode;
}

export function AnimatedButton({ children, ...props }: AnimatedButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button {...props}>{children}</Button>
    </motion.div>
  );
}


