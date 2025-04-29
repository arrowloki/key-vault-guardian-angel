
import { v4 as uuidv4 } from 'uuid';
import { Vault, VaultCredential, SecureNote, PaymentCard } from '../types/vault';

// Initialize an empty vault
export function initializeVault(): Vault {
  return {
    credentials: [],
    secureNotes: [],
    paymentCards: [],
    settings: {
      lockTimeout: 15, // minutes
      passwordGenerator: {
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilarCharacters: false
      }
    },
    locked: true,
    lastUnlocked: null
  };
}

// Add a new credential to the vault
export function addCredential(vault: Vault, credential: Omit<VaultCredential, 'id' | 'createdAt' | 'updatedAt' | 'favorite'>): Vault {
  const now = new Date();
  const newCredential: VaultCredential = {
    id: uuidv4(),
    ...credential,
    favorite: false,
    createdAt: now,
    updatedAt: now
  };

  return {
    ...vault,
    credentials: [...vault.credentials, newCredential]
  };
}

// Update an existing credential in the vault
export function updateCredential(vault: Vault, credential: VaultCredential): Vault {
  return {
    ...vault,
    credentials: vault.credentials.map(cred => 
      cred.id === credential.id 
        ? { ...credential, updatedAt: new Date() } 
        : cred
    )
  };
}

// Delete a credential from the vault
export function deleteCredential(vault: Vault, credentialId: string): Vault {
  return {
    ...vault,
    credentials: vault.credentials.filter(cred => cred.id !== credentialId)
  };
}

// Add a secure note to the vault
export function addSecureNote(vault: Vault, note: Omit<SecureNote, 'id' | 'createdAt' | 'updatedAt' | 'favorite'>): Vault {
  const now = new Date();
  const newNote: SecureNote = {
    id: uuidv4(),
    ...note,
    favorite: false,
    createdAt: now,
    updatedAt: now
  };

  return {
    ...vault,
    secureNotes: [...vault.secureNotes, newNote]
  };
}

// Add a payment card to the vault
export function addPaymentCard(vault: Vault, card: Omit<PaymentCard, 'id' | 'createdAt' | 'updatedAt' | 'favorite'>): Vault {
  const now = new Date();
  const newCard: PaymentCard = {
    id: uuidv4(),
    ...card,
    favorite: false,
    createdAt: now,
    updatedAt: now
  };

  return {
    ...vault,
    paymentCards: [...vault.paymentCards, newCard]
  };
}

// Toggle favorite status of an item
export function toggleFavorite(
  vault: Vault, 
  itemId: string, 
  itemType: 'credential' | 'note' | 'card'
): Vault {
  switch (itemType) {
    case 'credential':
      return {
        ...vault,
        credentials: vault.credentials.map(cred => 
          cred.id === itemId 
            ? { ...cred, favorite: !cred.favorite, updatedAt: new Date() } 
            : cred
        )
      };
    case 'note':
      return {
        ...vault,
        secureNotes: vault.secureNotes.map(note => 
          note.id === itemId 
            ? { ...note, favorite: !note.favorite, updatedAt: new Date() } 
            : note
        )
      };
    case 'card':
      return {
        ...vault,
        paymentCards: vault.paymentCards.map(card => 
          card.id === itemId 
            ? { ...card, favorite: !card.favorite, updatedAt: new Date() } 
            : card
        )
      };
    default:
      return vault;
  }
}

// Lock or unlock the vault
export function setVaultLockState(vault: Vault, locked: boolean): Vault {
  return {
    ...vault,
    locked,
    lastUnlocked: locked ? vault.lastUnlocked : new Date()
  };
}

// Find credentials matching a domain
export function findCredentialsByDomain(vault: Vault, domain: string): VaultCredential[] {
  return vault.credentials.filter(cred => {
    try {
      const url = new URL(cred.url);
      return url.hostname === domain || url.hostname.endsWith('.' + domain);
    } catch (e) {
      // If URL is invalid, do a simple includes check
      return cred.url.includes(domain);
    }
  });
}
