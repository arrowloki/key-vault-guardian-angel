
export interface MasterPassword {
  hash: string;
  salt: string;
}

export interface VaultCredential {
  id: string;
  title: string;
  url: string;
  username: string;
  password: string;
  notes?: string;
  category?: string;
  tags?: string[];
  favorite: boolean;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecureNote {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  favorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentCard {
  id: string;
  title: string;
  cardholderName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardType?: string;
  billingAddress?: Address;
  favorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  name?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface PasswordGeneratorSettings {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilarCharacters?: boolean;
}

export interface VaultSettings {
  lockTimeout: number; // minutes
  passwordGenerator: PasswordGeneratorSettings;
}

export interface Vault {
  credentials: VaultCredential[];
  secureNotes: SecureNote[];
  paymentCards: PaymentCard[];
  settings: VaultSettings;
  locked: boolean;
  lastUnlocked: Date | null;
}

export enum PasswordStrength {
  WEAK = 'weak',
  MEDIUM = 'medium',
  STRONG = 'strong',
}
