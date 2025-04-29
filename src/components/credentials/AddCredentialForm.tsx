
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useVault } from '@/contexts/VaultContext';
import { generatePassword } from '@/utils/passwordGenerator';
import { Plus, RefreshCw, Copy } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const AddCredentialForm: React.FC = () => {
  const { vault, addNewCredential } = useVault();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !url || !username || !password) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    addNewCredential({
      title,
      url,
      username,
      password,
      notes
    });
    
    // Reset form
    setTitle('');
    setUrl('');
    setUsername('');
    setPassword('');
    setNotes('');
    setOpen(false);
  };
  
  const generateRandomPassword = () => {
    if (vault) {
      const newPassword = generatePassword(vault.settings.passwordGenerator);
      setPassword(newPassword);
    }
  };
  
  const copyPasswordToClipboard = () => {
    if (password) {
      navigator.clipboard.writeText(password);
      toast({
        title: "Password copied",
        description: "The generated password has been copied to your clipboard",
        duration: 2000,
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-vault-amber text-vault-navy hover:bg-vault-amber/90">
          <Plus size={18} className="mr-1" /> Add New
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Login</DialogTitle>
            <DialogDescription>
              Save a new website login to your vault
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">Title</label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Gmail, Twitter"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="url" className="text-sm font-medium">Website URL</label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">Username or Email</label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username@example.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <div className="flex space-x-2">
                <Input
                  id="password"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1"
                  required
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  onClick={generateRandomPassword}
                  title="Generate random password"
                >
                  <RefreshCw size={16} />
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  onClick={copyPasswordToClipboard}
                  title="Copy password"
                  disabled={!password}
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional information..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-vault-navy hover:bg-vault-navy/90">
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCredentialForm;
