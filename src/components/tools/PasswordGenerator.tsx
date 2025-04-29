
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RefreshCw, Copy, Check } from 'lucide-react';
import { useVault } from '@/contexts/VaultContext';
import { generatePassword, evaluatePasswordStrength, PasswordStrength } from '@/utils/passwordGenerator';
import { useToast } from '@/components/ui/use-toast';

const PasswordGenerator: React.FC = () => {
  const { vault } = useVault();
  const { toast } = useToast();
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilarCharacters: false
  });
  
  const passwordStrength = evaluatePasswordStrength(generatedPassword);
  
  useEffect(() => {
    // Initialize with vault settings if available
    if (vault && vault.settings.passwordGenerator) {
      setSettings({
        ...vault.settings.passwordGenerator,
        excludeSimilarCharacters: false // Add any missing properties
      });
    }
    
    // Generate initial password
    generateNewPassword();
  }, [vault]);
  
  const generateNewPassword = () => {
    const newPassword = generatePassword(settings);
    setGeneratedPassword(newPassword);
    setCopied(false);
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    toast({
      title: "Password copied",
      description: "The generated password has been copied to your clipboard",
      duration: 2000,
    });
    
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleSettingChange = (key: keyof typeof settings, value: number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  const getStrengthText = () => {
    switch (passwordStrength) {
      case PasswordStrength.WEAK:
        return 'Weak';
      case PasswordStrength.MEDIUM:
        return 'Good';
      case PasswordStrength.STRONG:
        return 'Strong';
      default:
        return 'Unknown';
    }
  };
  
  const getStrengthColor = () => {
    switch (passwordStrength) {
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
  
  useEffect(() => {
    if (settings.length && (settings.includeUppercase || settings.includeLowercase || settings.includeNumbers || settings.includeSymbols)) {
      generateNewPassword();
    }
  }, [settings]);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Password Generator</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex">
            <Input
              value={generatedPassword}
              onChange={(e) => setGeneratedPassword(e.target.value)}
              className="font-mono flex-1"
              readOnly
            />
            <Button
              variant="outline"
              size="icon"
              className="ml-2"
              onClick={generateNewPassword}
            >
              <RefreshCw size={16} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="ml-2"
              onClick={copyToClipboard}
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </Button>
          </div>
          
          <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getStrengthColor()}`}
              style={{ width: passwordStrength === PasswordStrength.WEAK ? '33%' : 
                         passwordStrength === PasswordStrength.MEDIUM ? '66%' : '100%' }}
            />
          </div>
          <p className="text-xs text-gray-500">
            {getStrengthText()} password
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="length">Length: {settings.length}</Label>
            </div>
            <Slider
              id="length"
              min={8}
              max={32}
              step={1}
              value={[settings.length]}
              onValueChange={(values) => handleSettingChange('length', values[0])}
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="uppercase">Include Uppercase Letters (A-Z)</Label>
              <Switch
                id="uppercase"
                checked={settings.includeUppercase}
                onCheckedChange={(checked) => handleSettingChange('includeUppercase', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="lowercase">Include Lowercase Letters (a-z)</Label>
              <Switch
                id="lowercase"
                checked={settings.includeLowercase}
                onCheckedChange={(checked) => handleSettingChange('includeLowercase', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="numbers">Include Numbers (0-9)</Label>
              <Switch
                id="numbers"
                checked={settings.includeNumbers}
                onCheckedChange={(checked) => handleSettingChange('includeNumbers', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="symbols">Include Symbols (!@#$%^&*)</Label>
              <Switch
                id="symbols"
                checked={settings.includeSymbols}
                onCheckedChange={(checked) => handleSettingChange('includeSymbols', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="similar">Exclude Similar Characters (i, l, 1, O, 0)</Label>
              <Switch
                id="similar"
                checked={settings.excludeSimilarCharacters}
                onCheckedChange={(checked) => handleSettingChange('excludeSimilarCharacters', checked)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PasswordGenerator;
