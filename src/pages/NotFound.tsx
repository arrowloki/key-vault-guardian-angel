
import React from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-full flex items-center justify-center bg-gray-100" style={{minHeight: '400px'}}>
      <div className="text-center px-6">
        <h1 className="text-4xl font-bold mb-4 text-vault-navy">404</h1>
        <p className="text-xl text-gray-600 mb-6">Oops! This page wasn't found in your vault</p>
        <Button 
          className="bg-vault-amber text-vault-navy hover:bg-vault-amber/90"
          onClick={() => window.location.href = "/"}
        >
          Return to Vault
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
