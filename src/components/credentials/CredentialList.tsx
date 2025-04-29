
import React, { useState } from 'react';
import { useVault } from '@/contexts/VaultContext';
import { VaultCredential } from '@/types/vault';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Plus, Star, Eye, EyeOff, Copy, Trash } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const CredentialList: React.FC = () => {
  const { vault, toggleItemFavorite, removeCredential } = useVault();
  const [searchTerm, setSearchTerm] = useState('');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  
  const credentials = vault?.credentials || [];
  
  const filteredCredentials = credentials.filter(cred => 
    cred.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cred.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cred.username.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  const copyToClipboard = (text: string, type: 'username' | 'password') => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${type === 'username' ? 'Username' : 'Password'} copied`,
      description: `The ${type} has been copied to your clipboard`,
      duration: 2000,
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Search credentials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button className="bg-vault-amber text-vault-navy hover:bg-vault-amber/90">
          <Plus size={18} className="mr-1" /> Add New
        </Button>
      </div>
      
      <div className="space-y-3">
        {filteredCredentials.length === 0 ? (
          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <p className="text-gray-500">No credentials found</p>
            </CardContent>
          </Card>
        ) : (
          filteredCredentials.map((credential) => (
            <Card key={credential.id} className="vault-card hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium">{credential.title}</h3>
                      <button 
                        onClick={() => toggleItemFavorite(credential.id, 'credential')}
                        className="ml-2 text-gray-400 hover:text-vault-amber focus:outline-none"
                      >
                        <Star size={18} className={credential.favorite ? "fill-vault-amber text-vault-amber" : ""} />
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{credential.url}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <p className="text-sm font-medium w-24">Username:</p>
                        <p className="text-sm flex-1">{credential.username}</p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0" 
                          onClick={() => copyToClipboard(credential.username, 'username')}
                        >
                          <Copy size={14} />
                        </Button>
                      </div>
                      
                      <div className="flex items-center">
                        <p className="text-sm font-medium w-24">Password:</p>
                        <p className="text-sm flex-1 password-field">
                          {showPasswords[credential.id] ? credential.password : '••••••••'}
                        </p>
                        <div className="flex">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0" 
                            onClick={() => togglePasswordVisibility(credential.id)}
                          >
                            {showPasswords[credential.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0" 
                            onClick={() => copyToClipboard(credential.password, 'password')}
                          >
                            <Copy size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-500" 
                    onClick={() => removeCredential(credential.id)}
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CredentialList;
