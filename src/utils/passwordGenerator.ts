
import { PasswordGeneratorSettings, PasswordStrength } from '../types/vault';

const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const NUMBER_CHARS = '0123456789';
const SYMBOL_CHARS = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
const SIMILAR_CHARS = 'iloO01';

export function generatePassword(settings: PasswordGeneratorSettings): string {
  let chars = '';
  
  if (settings.includeUppercase) chars += UPPERCASE_CHARS;
  if (settings.includeLowercase) chars += LOWERCASE_CHARS;
  if (settings.includeNumbers) chars += NUMBER_CHARS;
  if (settings.includeSymbols) chars += SYMBOL_CHARS;
  
  if (settings.excludeSimilarCharacters) {
    SIMILAR_CHARS.split('').forEach(char => {
      chars = chars.replace(char, '');
    });
  }
  
  if (chars.length === 0) {
    // Fallback to lowercase and numbers if nothing selected
    chars = LOWERCASE_CHARS + NUMBER_CHARS;
  }
  
  let password = '';
  const array = new Uint8Array(settings.length);
  window.crypto.getRandomValues(array);
  
  for (let i = 0; i < settings.length; i++) {
    password += chars.charAt(array[i] % chars.length);
  }
  
  // Ensure at least one character from each selected type is included
  let finalPassword = password;
  
  if (settings.includeUppercase) {
    finalPassword = ensureCharType(finalPassword, UPPERCASE_CHARS);
  }
  if (settings.includeLowercase) {
    finalPassword = ensureCharType(finalPassword, LOWERCASE_CHARS);
  }
  if (settings.includeNumbers) {
    finalPassword = ensureCharType(finalPassword, NUMBER_CHARS);
  }
  if (settings.includeSymbols) {
    finalPassword = ensureCharType(finalPassword, SYMBOL_CHARS);
  }
  
  return finalPassword;
}

function ensureCharType(password: string, chars: string): string {
  if (password.split('').some(char => chars.includes(char))) {
    return password;
  }
  
  const array = new Uint8Array(1);
  window.crypto.getRandomValues(array);
  const pos = array[0] % password.length;
  const randomCharArray = new Uint8Array(1);
  window.crypto.getRandomValues(randomCharArray);
  const char = chars.charAt(randomCharArray[0] % chars.length);
  
  return password.substring(0, pos) + char + password.substring(pos + 1);
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) return PasswordStrength.WEAK;
  
  const length = password.length;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[^a-zA-Z0-9]/.test(password);
  
  const typesOfChars = [hasUppercase, hasLowercase, hasNumbers, hasSymbols].filter(Boolean).length;
  
  if (length < 8 || typesOfChars < 2) {
    return PasswordStrength.WEAK;
  } else if (length >= 12 && typesOfChars >= 3) {
    return PasswordStrength.STRONG;
  } else {
    return PasswordStrength.MEDIUM;
  }
}
