
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CredentialList from '@/components/credentials/CredentialList';
import AddCredentialForm from '@/components/credentials/AddCredentialForm';
import PasswordGenerator from '@/components/tools/PasswordGenerator';
import { useVault } from '@/contexts/VaultContext';
import { Lock, Key, CreditCard, FileText, Shield } from 'lucide-react';

const VaultDashboard: React.FC = () => {
  const { vault, lockVault } = useVault();
  const [activeTab, setActiveTab] = useState('passwords');
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const totalItems = (vault?.credentials?.length || 0) + 
                     (vault?.secureNotes?.length || 0) + 
                     (vault?.paymentCards?.length || 0);
  
  return (
    <div className="container mx-auto p-4 max-w-screen-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Key Vault Guardian Angel</h1>
          <p className="text-gray-500">Securely store and manage your passwords</p>
        </div>
        
        <Button 
          variant="outline" 
          className="mt-4 md:mt-0"
          onClick={lockVault}
        >
          <Lock size={16} className="mr-2" />
          Lock Vault
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-medium">Vault Summary</h2>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Key size={18} className="mr-2 text-vault-amber" />
                    <span>Logins</span>
                  </div>
                  <span className="font-medium">{vault?.credentials.length || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText size={18} className="mr-2 text-vault-amber" />
                    <span>Secure Notes</span>
                  </div>
                  <span className="font-medium">{vault?.secureNotes.length || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CreditCard size={18} className="mr-2 text-vault-amber" />
                    <span>Payment Cards</span>
                  </div>
                  <span className="font-medium">{vault?.paymentCards.length || 0}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield size={18} className="mr-2 text-vault-navy" />
                    <span>Total Items</span>
                  </div>
                  <span className="font-medium">{totalItems}</span>
                </div>
              </div>
            </div>
            
            {/* Quick Tools Section */}
            <div className="border-t border-gray-200">
              <div className="p-4">
                <h2 className="font-medium mb-3">Quick Tools</h2>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left"
                    onClick={() => handleTabChange('generator')}
                  >
                    <RefreshIcon className="mr-2" size={16} />
                    Password Generator
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-3">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="passwords">Logins</TabsTrigger>
              <TabsTrigger value="notes">Secure Notes</TabsTrigger>
              <TabsTrigger value="cards">Payment Cards</TabsTrigger>
              <TabsTrigger value="generator">Generator</TabsTrigger>
            </TabsList>
            
            <TabsContent value="passwords" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Saved Logins</h2>
                <AddCredentialForm />
              </div>
              <CredentialList />
            </TabsContent>
            
            <TabsContent value="notes" className="mt-4">
              <h2 className="text-xl font-semibold mb-4">Secure Notes</h2>
              <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-500">This feature will be available in the next version.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="cards" className="mt-4">
              <h2 className="text-xl font-semibold mb-4">Payment Cards</h2>
              <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-500">This feature will be available in the next version.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="generator" className="mt-4">
              <h2 className="text-xl font-semibold mb-4">Password Generator</h2>
              <PasswordGenerator />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

// Simple Refresh Icon for Quick Tools
const RefreshIcon = ({ className, size }: { className?: string; size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size || 24}
    height={size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

export default VaultDashboard;
