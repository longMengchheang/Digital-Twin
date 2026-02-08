/**
 * Formats a date or date string into a localized string with month and year.
 * Example: "January 2023"
 */
export function formatJoinDate(date: Date | string): string {
  const parsed = new Date(date);
  return parsed.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
