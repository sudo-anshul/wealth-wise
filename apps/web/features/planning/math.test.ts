import { describe, expect, it } from 'vitest';
import { calculateSIP } from '@wealthwise/domain';
import { calculateGoalContribution } from './math';

describe('goal contribution planning', () => {
  it('finds the minimum whole-paise amount at zero return', () => {
    expect(calculateGoalContribution(1_200_000, 0, 1)).toBe(100_000);
    expect(calculateGoalContribution(1_200_001, 0, 1)).toBe(100_001);
  });
  it('meets the target while one paise less does not', () => {
    const target = 25_000_000; const monthly = calculateGoalContribution(target, 8, 10);
    expect(calculateSIP(monthly, 8, 10).totalMinor).toBeGreaterThanOrEqual(target);
    expect(calculateSIP(monthly - 1, 8, 10).totalMinor).toBeLessThan(target);
  });
  it('does not overflow intermediate guesses for a long horizon', () => {
    const target = 100_000_000; const monthly = calculateGoalContribution(target, 60, 50);
    expect(monthly).toBe(1);
    expect(calculateSIP(monthly, 60, 50).totalMinor).toBeGreaterThanOrEqual(target);
  });
  it('rejects unsafe or invalid inputs', () => {
    expect(() => calculateGoalContribution(-1, 8, 10)).toThrow();
    expect(() => calculateGoalContribution(1_000_000, 8, 0)).toThrow();
    expect(calculateGoalContribution(0, 8, 10)).toBe(0);
  });
});
