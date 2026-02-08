import { expect, test, describe } from 'bun:test';
import { formatJoinDate } from './date';

describe('formatJoinDate', () => {
  test('formats a Date object correctly', () => {
    // Using a specific date: January 15, 2023
    // We use the constructor with arguments to ensure it's treated as local time
    // so toLocaleDateString (which uses local time) returns the expected result.
    const date = new Date(2023, 0, 15);
    expect(formatJoinDate(date)).toBe('January 2023');
  });

  test('formats a date string correctly', () => {
    // Using a mid-month date to avoid timezone rollover issues
    // "2023-05-15" is parsed as UTC, but even with timezone shifts,
    // the 15th will likely remain in May for any reasonable timezone.
    expect(formatJoinDate('2023-05-15')).toBe('May 2023');
  });

  test('handles leap year dates', () => {
    // Feb 2024 is a leap year. Using mid-month.
    expect(formatJoinDate('2024-02-15')).toBe('February 2024');
  });

  test('handles different months and years', () => {
    expect(formatJoinDate('2025-11-15')).toBe('November 2025');
    expect(formatJoinDate('1999-12-15')).toBe('December 1999');
  });
});
