/**
 * Validates a password based on simplified requirements.
 * Requirements:
 * - At least 6 characters long
 */
export function validatePassword(password: string): { isValid: boolean; message: string } {
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long.' };
  }
  return { isValid: true, message: '' };
}

/**
 * Validates an email address format.
 */
export function validateEmail(email: string): { isValid: boolean; message: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Invalid email format.' };
  }
  return { isValid: true, message: '' };
}
