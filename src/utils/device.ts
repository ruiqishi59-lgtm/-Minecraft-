export type DeviceCategory = 'tablet' | 'mobile' | 'desktop';

/**
 * Accurately detects touch-first tablets and phones, including iPadOS Safari
 * which reports "Macintosh" in navigator.userAgent alongside maxTouchPoints > 1.
 */
export function detectTouchOrTabletDevice(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent || '';
  const hasTouchPoints =
    'ontouchstart' in window || (navigator.maxTouchPoints ?? 0) > 0;
  const isIPadOS =
    /Macintosh/i.test(ua) && (navigator.maxTouchPoints ?? 0) > 1;
  const isTabletUA =
    /iPad|Tablet|PlayBook|Silk/i.test(ua) ||
    (/Android/i.test(ua) && !/Mobile/i.test(ua));
  const isCoarsePointer =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches;

  return (
    isIPadOS ||
    isTabletUA ||
    isCoarsePointer ||
    hasTouchPoints ||
    window.innerWidth < 800
  );
}

export function getDeviceCategory(): DeviceCategory {
  if (typeof window === 'undefined') return 'desktop';

  const ua = navigator.userAgent || '';
  const hasTouch =
    'ontouchstart' in window ||
    (navigator.maxTouchPoints ?? 0) > 0 ||
    (typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: coarse)').matches);

  const isIPadOS =
    /Macintosh/i.test(ua) && (navigator.maxTouchPoints ?? 0) > 1;
  const isTabletUA =
    /iPad|Tablet|PlayBook|Silk/i.test(ua) ||
    (/Android/i.test(ua) && !/Mobile/i.test(ua));

  if (isIPadOS || isTabletUA) return 'tablet';

  if (hasTouch) {
    const minSide = Math.min(window.innerWidth, window.innerHeight);
    if (minSide >= 600 || window.innerWidth >= 768) {
      return 'tablet';
    }
    return 'mobile';
  }

  return 'desktop';
}
