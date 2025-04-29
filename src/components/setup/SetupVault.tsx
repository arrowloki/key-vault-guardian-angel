
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useVault } from '@/contexts/VaultContext';
import { Shield } from 'lucide-react';
import { evaluatePasswordStrength, PasswordStrength } from '@/utils/passwordGenerator';

const SetupVault: React.FC = () => {
  const { setupVault } = useVault();
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordHint, setPasswordHint] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const passwordStrength = evaluatePasswordStrength(masterPassword);
  
  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (masterPassword.length < 8) {
      setError('Master password must be at least 8 characters');
      return;
    }
    
    if (masterPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await setupVault(masterPassword);
    } catch (error) {
      setError('Failed to set up vault');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getStrengthColor = (strength: PasswordStrength) => {
    switch (strength) {
      case PasswordStrength.WEAK:
        return 'bg-red-500';
      case PasswordStrength.MEDIUM:
        return 'bg-yellow-500';
      case PasswordStrength.STRONG:
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-vault-navy flex items-center justify-center mb-4">
            <Shield size={30} className="text-vault-amber" />
          </div>
          <CardTitle className="text-2xl">Set Up Your Vault</CardTitle>
          <CardDescription>Create a strong master password to protect all your passwords</CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSetup}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="masterPassword" className="text-sm font-medium">Master Password</label>
              <Input
                id="masterPassword"
                type="password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                className="w-full"
                placeholder="Create a strong password"
                autoComplete="new-password"
              />
              <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getStrengthColor(passwordStrength)}`}
                  style={{ width: passwordStrength === PasswordStrength.WEAK ? '33%' : 
                             passwordStrength === PasswordStrength.MEDIUM ? '66%' : '100%' }}
                />
              </div>
              <p className="text-xs text-gray-500">
                {passwordStrength === PasswordStrength.WEAK ? 'Weak' : 
                 passwordStrength === PasswordStrength.MEDIUM ? 'Good' : 'Strong'} password
              </p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Master Password</label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full"
                placeholder="Confirm your password"
                autoComplete="new-password"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="passwordHint" className="text-sm font-medium">Password Hint (Optional)</label>
              <Input
                id="passwordHint"
                type="text"
                value={passwordHint}
                onChange={(e) => setPasswordHint(e.target.value)}
                className="w-full"
                placeholder="Add a hint to help remember your password"
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
              {isSubmitting ? 'Creating Vault...' : 'Create Vault'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default SetupVault;
