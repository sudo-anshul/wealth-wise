import { calculateSIP } from '@wealthwise/domain';

/** Smallest whole-paise monthly contribution whose rounded projection reaches the target. */
export function calculateGoalContribution(targetMinor: number, annualRate: number, years: number) {
  if (!Number.isSafeInteger(targetMinor) || targetMinor < 0) throw new Error('Enter a supported target amount.');
  const unitProjection = calculateSIP(1, annualRate, years).totalMinor;
  if (targetMinor === 0) return 0;
  // The rounded one-paise result differs from its exact linear factor by at most half a paise.
  // This bound avoids testing huge monthly values which could overflow long-horizon projections.
  let low = 0; let high = Math.min(targetMinor, Math.max(1, Math.ceil(targetMinor / Math.max(1, unitProjection - .5))));
  while (low < high) { const middle = Math.floor((low + high) / 2); if (calculateSIP(middle, annualRate, years).totalMinor >= targetMinor) high = middle; else low = middle + 1; }
  return low;
}
