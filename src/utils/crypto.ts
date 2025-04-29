
// A simplified crypto utility (For a real extension, use Web Crypto API with proper encryption)
// This is a simplified version for demonstration purposes only

export async function generateSalt(): Promise<string> {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  // In a real application, use PBKDF2 or Argon2id
  // This is a simplified version using SHA-256 for demonstration
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function encryptData(data: string, key: string): string {
  // In a real extension, use AES-GCM with proper IV handling
  // This is just a placeholder - DO NOT use in production
  return btoa(data); // Simple base64 encoding for demonstration only
}

export function decryptData(encryptedData: string, key: string): string {
  // In a real extension, use AES-GCM with proper IV handling
  // This is just a placeholder - DO NOT use in production
  return atob(encryptedData); // Simple base64 decoding for demonstration only
}
