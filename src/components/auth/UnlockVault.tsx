
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useVault } from '@/contexts/VaultContext';
import { Lock } from 'lucide-react';

const UnlockVault: React.FC = () => {
  const { unlockVault } = useVault();
  const [masterPassword, setMasterPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!masterPassword) {
      setError('Please enter your master password');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const success = await unlockVault(masterPassword);
      if (!success) {
        setError('Incorrect master password');
      }
    } catch (error) {
      setError('Failed to unlock vault');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-vault-navy flex items-center justify-center mb-4">
            <Lock size={30} className="text-vault-amber" />
          </div>
          <CardTitle className="text-2xl">Unlock Your Vault</CardTitle>
          <CardDescription>Enter your master password to access your passwords</CardDescription>
        </CardHeader>
        
        <form onSubmit={handleUnlock}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="masterPassword" className="text-sm font-medium">Master Password</label>
              <Input
                id="masterPassword"
                type="password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                className="w-full"
                placeholder="Enter your master password"
                autoComplete="current-password"
              />
            </div>
            
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </CardContent>
          
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full bg-vault-navy hover:bg-vault-navy/90 text-white" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Unlocking...' : 'Unlock Vault'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default UnlockVault;
