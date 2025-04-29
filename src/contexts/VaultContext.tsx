
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Vault, MasterPassword, VaultCredential, SecureNote, PaymentCard } from '../types/vault';
import { hashPassword, generateSalt } from '../utils/crypto';
import { initializeVault, addCredential, updateCredential, deleteCredential, addSecureNote, addPaymentCard, toggleFavorite, setVaultLockState } from '../utils/vaultUtils';
import { useToast } from '@/components/ui/use-toast';

interface VaultContextType {
  vault: Vault | null;
  isVaultSetup: boolean;
  isVaultUnlocked: boolean;
  setupVault: (masterPassword: string) => Promise<void>;
  unlockVault: (masterPassword: string) => Promise<boolean>;
  lockVault: () => void;
  addNewCredential: (credential: Omit<VaultCredential, 'id' | 'createdAt' | 'updatedAt' | 'favorite'>) => void;
  updateExistingCredential: (credential: VaultCredential) => void;
  removeCredential: (credentialId: string) => void;
  addNewSecureNote: (note: Omit<SecureNote, 'id' | 'createdAt' | 'updatedAt' | 'favorite'>) => void;
  addNewPaymentCard: (card: Omit<PaymentCard, 'id' | 'createdAt' | 'updatedAt' | 'favorite'>) => void;
  toggleItemFavorite: (itemId: string, itemType: 'credential' | 'note' | 'card') => void;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [vault, setVault] = useState<Vault | null>(null);
  const [masterPasswordInfo, setMasterPasswordInfo] = useState<MasterPassword | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if vault exists in storage
    const checkVaultSetup = async () => {
      try {
        const storedVault = localStorage.getItem('vault');
        const storedMasterPassword = localStorage.getItem('masterPassword');
        
        if (storedVault && storedMasterPassword) {
          setVault(JSON.parse(storedVault));
          setMasterPasswordInfo(JSON.parse(storedMasterPassword));
        } else {
          setVault(initializeVault());
        }
      } catch (error) {
        console.error('Error loading vault:', error);
        toast({
          title: "Error loading vault",
          description: "There was a problem loading your vault.",
          variant: "destructive"
        });
      }
    };
    
    checkVaultSetup();
  }, [toast]);

  // Set up the vault with a new master password
  const setupVault = async (masterPassword: string) => {
    try {
      const salt = await generateSalt();
      const hash = await hashPassword(masterPassword, salt);
      const newMasterPasswordInfo = { hash, salt };
      
      setMasterPasswordInfo(newMasterPasswordInfo);
      localStorage.setItem('masterPassword', JSON.stringify(newMasterPasswordInfo));
      
      const newVault = initializeVault();
      const unlockedVault = setVaultLockState(newVault, false);
      setVault(unlockedVault);
      localStorage.setItem('vault', JSON.stringify(unlockedVault));
      
      toast({
        title: "Vault created",
        description: "Your vault has been set up successfully.",
      });
    } catch (error) {
      console.error('Error setting up vault:', error);
      toast({
        title: "Error setting up vault",
        description: "There was a problem creating your vault.",
        variant: "destructive"
      });
    }
  };

  // Unlock the vault with master password
  const unlockVault = async (masterPassword: string): Promise<boolean> => {
    if (!masterPasswordInfo) return false;
    
    try {
      const { salt, hash } = masterPasswordInfo;
      const inputHash = await hashPassword(masterPassword, salt);
      
      if (inputHash === hash) {
        if (vault) {
          const unlockedVault = setVaultLockState(vault, false);
          setVault(unlockedVault);
          localStorage.setItem('vault', JSON.stringify(unlockedVault));
        }
        return true;
      } else {
        toast({
          title: "Incorrect password",
          description: "The master password is incorrect.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error unlocking vault:', error);
      toast({
        title: "Error unlocking vault",
        description: "There was a problem unlocking your vault.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Lock the vault
  const lockVault = () => {
    if (vault) {
      const lockedVault = setVaultLockState(vault, true);
      setVault(lockedVault);
      localStorage.setItem('vault', JSON.stringify(lockedVault));
      toast({
        title: "Vault locked",
        description: "Your vault has been locked for security.",
      });
    }
  };

  // Add a new credential
  const addNewCredential = (credential: Omit<VaultCredential, 'id' | 'createdAt' | 'updatedAt' | 'favorite'>) => {
    if (vault && !vault.locked) {
      const updatedVault = addCredential(vault, credential);
      setVault(updatedVault);
      localStorage.setItem('vault', JSON.stringify(updatedVault));
      toast({
        title: "Credential added",
        description: `${credential.title} has been saved to your vault.`,
      });
    }
  };

  // Update an existing credential
  const updateExistingCredential = (credential: VaultCredential) => {
    if (vault && !vault.locked) {
      const updatedVault = updateCredential(vault, credential);
      setVault(updatedVault);
      localStorage.setItem('vault', JSON.stringify(updatedVault));
      toast({
        title: "Credential updated",
        description: `${credential.title} has been updated.`,
      });
    }
  };

  // Remove a credential
  const removeCredential = (credentialId: string) => {
    if (vault && !vault.locked) {
      const credentialToDelete = vault.credentials.find(cred => cred.id === credentialId);
      const updatedVault = deleteCredential(vault, credentialId);
      setVault(updatedVault);
      localStorage.setItem('vault', JSON.stringify(updatedVault));
      
      if (credentialToDelete) {
        toast({
          title: "Credential deleted",
          description: `${credentialToDelete.title} has been removed from your vault.`,
        });
      }
    }
  };

  // Add a new secure note
  const addNewSecureNote = (note: Omit<SecureNote, 'id' | 'createdAt' | 'updatedAt' | 'favorite'>) => {
    if (vault && !vault.locked) {
      const updatedVault = addSecureNote(vault, note);
      setVault(updatedVault);
      localStorage.setItem('vault', JSON.stringify(updatedVault));
      toast({
        title: "Secure note added",
        description: `${note.title} has been saved to your vault.`,
      });
    }
  };

  // Add a new payment card
  const addNewPaymentCard = (card: Omit<PaymentCard, 'id' | 'createdAt' | 'updatedAt' | 'favorite'>) => {
    if (vault && !vault.locked) {
      const updatedVault = addPaymentCard(vault, card);
      setVault(updatedVault);
      localStorage.setItem('vault', JSON.stringify(updatedVault));
      toast({
        title: "Payment card added",
        description: `${card.title} has been saved to your vault.`,
      });
    }
  };

  // Toggle favorite status of an item
  const toggleItemFavorite = (itemId: string, itemType: 'credential' | 'note' | 'card') => {
    if (vault && !vault.locked) {
      const updatedVault = toggleFavorite(vault, itemId, itemType);
      setVault(updatedVault);
      localStorage.setItem('vault', JSON.stringify(updatedVault));
    }
  };

  const contextValue: VaultContextType = {
    vault,
    isVaultSetup: !!masterPasswordInfo,
    isVaultUnlocked: !!vault && !vault.locked,
    setupVault,
    unlockVault,
    lockVault,
    addNewCredential,
    updateExistingCredential,
    removeCredential,
    addNewSecureNote,
    addNewPaymentCard,
    toggleItemFavorite
  };

  return (
    <VaultContext.Provider value={contextValue}>
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (context === undefined) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
};
