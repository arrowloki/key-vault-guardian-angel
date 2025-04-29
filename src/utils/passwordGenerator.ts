
import { PasswordGeneratorSettings } from '../types/vault';
// We'll export the PasswordStrength enum directly from the utils file
export enum PasswordStrength {
  WEAK = 'weak',
  MEDIUM = 'medium',
  STRONG = 'strong',
}

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

// Calculate password entropy in bits
export function calculatePasswordEntropy(password: string): number {
  if (!password) return 0;
  
  let charsetSize = 0;
  if (/[a-z]/.test(password)) charsetSize += 26;
  if (/[A-Z]/.test(password)) charsetSize += 26;
  if (/[0-9]/.test(password)) charsetSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 33; // Approximate number of common symbols
  
  return Math.log2(Math.pow(charsetSize, password.length));
}

// Estimate time to crack based on entropy
export function estimateCrackTime(entropy: number): string {
  // Assuming 10 billion guesses per second (high-end hardware)
  const guessesPerSecond = 10000000000;
  const possibleCombinations = Math.pow(2, entropy);
  const secondsToCrack = possibleCombinations / guessesPerSecond / 2; // Average case is half the combinations
  
  if (secondsToCrack < 60) {
    return 'less than a minute';
  } else if (secondsToCrack < 3600) {
    return `about ${Math.round(secondsToCrack / 60)} minutes`;
  } else if (secondsToCrack < 86400) {
    return `about ${Math.round(secondsToCrack / 3600)} hours`;
  } else if (secondsToCrack < 2592000) {
    return `about ${Math.round(secondsToCrack / 86400)} days`;
  } else if (secondsToCrack < 31536000) {
    return `about ${Math.round(secondsToCrack / 2592000)} months`;
  } else if (secondsToCrack < 3153600000) { // 100 years
    return `about ${Math.round(secondsToCrack / 31536000)} years`;
  } else {
    return 'over 100 years';
  }
}

// Generate a pronounceable password (easier to remember)
export function generatePronounceablePassword(length: number): string {
  const vowels = 'aeiouy';
  const consonants = 'bcdfghjklmnpqrstvwxz';
  let password = '';
  
  const array = new Uint8Array(length * 2); // We'll need more random values
  window.crypto.getRandomValues(array);
  
  let index = 0;
  // Start with a consonant or vowel randomly
  let useConsonant = array[index++] % 2 === 0;
  
  while (password.length < length) {
    if (useConsonant) {
      password += consonants.charAt(array[index++] % consonants.length);
    } else {
      password += vowels.charAt(array[index++] % vowels.length);
    }
    
    // Toggle between consonants and vowels
    useConsonant = !useConsonant;
    
    // Occasionally capitalize or add a number to improve strength
    if (password.length > 3 && array[index] % 10 === 0 && password.length < length - 1) {
      // Capitalize last letter
      password = password.slice(0, -1) + password.slice(-1).toUpperCase();
      // Add a number
      if (password.length < length - 1 && array[index] % 5 === 0) {
        password += (array[index] % 10).toString();
        index++;
      }
    }
    
    // Reset index if we're running out of random values
    if (index >= array.length - 2) {
      window.crypto.getRandomValues(array);
      index = 0;
    }
  }
  
  // Make sure the first letter is capitalized
  password = password.charAt(0).toUpperCase() + password.slice(1);
  
  // Add a number at the end to improve strength if we have space
  if (password.length < length) {
    password += (array[index] % 10).toString();
  }
  
  // Truncate if we ended up too long
  return password.substring(0, length);
}
