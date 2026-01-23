import confetti from 'canvas-confetti';

/**
 * Triggers a celebratory confetti effect
 * @param options Optional configuration for the confetti effect
 */
export const triggerConfetti = (options?: {
  duration?: number;
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
}) => {
  const {
    duration = 3000,
    particleCount = 100,
    spread = 70,
    origin = { x: 0.5, y: 0.5 },
  } = options || {};

  const end = Date.now() + duration;

  // Colors matching the app's sage green theme with complementary accents
  const colors = ['#10b981', '#34d399', '#6ee7b7', '#3b82f6', '#60a5fa', '#8b5cf6', '#a78bfa', '#f59e0b', '#fbbf24'];

  const interval = setInterval(() => {
    if (Date.now() > end) {
      clearInterval(interval);
      return;
    }

    // Launch confetti from multiple positions for a more dynamic effect
    confetti({
      particleCount: Math.floor(particleCount / 3),
      angle: 60,
      spread: spread,
      origin: { x: 0.1, y: 0.8 },
      colors: colors,
    });

    confetti({
      particleCount: Math.floor(particleCount / 3),
      angle: 120,
      spread: spread,
      origin: { x: 0.9, y: 0.8 },
      colors: colors,
    });

    confetti({
      particleCount: Math.floor(particleCount / 3),
      angle: 90,
      spread: spread,
      origin: origin,
      colors: colors,
    });
  }, 200);
};

/**
 * Triggers a burst confetti effect (single burst)
 */
export const triggerConfettiBurst = () => {
  // Colors matching the app's sage green theme with complementary accents
  const colors = ['#10b981', '#34d399', '#6ee7b7', '#3b82f6', '#60a5fa', '#8b5cf6', '#a78bfa', '#f59e0b', '#fbbf24'];

  confetti({
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 },
    colors: colors,
  });

  // Additional bursts for more celebration
  setTimeout(() => {
    confetti({
      particleCount: 100,
      angle: 60,
      spread: 55,
      origin: { x: 0.1, y: 0.8 },
      colors: colors,
    });
  }, 250);

  setTimeout(() => {
    confetti({
      particleCount: 100,
      angle: 120,
      spread: 55,
      origin: { x: 0.9, y: 0.8 },
      colors: colors,
    });
  }, 400);
};
