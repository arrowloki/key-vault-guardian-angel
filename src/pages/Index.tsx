
import React from 'react';
import { VaultProvider } from '@/contexts/VaultContext';
import SetupVault from '@/components/setup/SetupVault';
import UnlockVault from '@/components/auth/UnlockVault';
import VaultDashboard from '@/components/dashboard/VaultDashboard';
import { useVault } from '@/contexts/VaultContext';

// Main app wrapper that provides vault context
const Index = () => {
  return (
    <VaultProvider>
      <VaultMain />
    </VaultProvider>
  );
};

// Component that uses the vault context
const VaultMain = () => {
  const { isVaultSetup, isVaultUnlocked } = useVault();
  
  // Show setup screen if vault isn't set up
  if (!isVaultSetup) {
    return <SetupVault />;
  }
  
  // Show unlock screen if vault is locked
  if (!isVaultUnlocked) {
    return <UnlockVault />;
  }
  
  // Show the main dashboard if vault is unlocked
  return <VaultDashboard />;
};

export default Index;
