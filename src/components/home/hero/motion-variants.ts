/**
 * Shared Framer Motion animation variants for the HeroSection.
 * These provide a unified, staggered entrance animation for all hero components.
 */

import type { Variants } from 'framer-motion';

/**
 * Container variant for the hero section.
 * Orchestrates staggered children animations.
 */
export const heroContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

/**
 * Standard item variant for most hero elements.
 * Fades in and slides up with spring physics.
 */
export const heroItemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20, 
    scale: 0.95,
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: "spring", 
      stiffness: 100, 
      damping: 15,
    },
  },
};

/**
 * Variant for the PactVisual - scales in with more drama.
 */
export const heroVisualVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      type: "spring", 
      stiffness: 80, 
      damping: 12,
      duration: 0.6,
    },
  },
};

/**
 * Variant for the focus message - slides in from left.
 */
export const heroSlideInVariants: Variants = {
  hidden: { 
    opacity: 0, 
    x: -20,
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      type: "spring", 
      stiffness: 100, 
      damping: 15,
    },
  },
};

/**
 * Variant for the XP progress bar - animates width.
 */
export const heroProgressVariants: Variants = {
  hidden: { 
    opacity: 0,
    scaleX: 0,
  },
  visible: { 
    opacity: 1,
    scaleX: 1,
    transition: { 
      type: "spring", 
      stiffness: 60, 
      damping: 15,
      delay: 0.2,
    },
  },
};
