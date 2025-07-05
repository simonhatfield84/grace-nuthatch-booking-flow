
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { AdminData } from '@/types/setup';

interface AdminAccountFormProps {
  adminData: AdminData;
  onInputChange: (field: keyof AdminData, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

export const AdminAccountForm: React.FC<AdminAccountFormProps> = ({
  adminData,
  onInputChange,
  onSubmit,
  loading
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    console.log('📝 Form submission started');
    console.log('📋 Form data:', adminData);
    console.log('⏳ Loading state:', loading);
    
    e.preventDefault();
    console.log('🚀 Calling onSubmit...');
    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            type="text"
            value={adminData.firstName}
            onChange={(e) => onInputChange('firstName', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            type="text"
            value={adminData.lastName}
            onChange={(e) => onInputChange('lastName', e.target.value)}
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          value={adminData.email}
          onChange={(e) => onInputChange('email', e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={adminData.password}
          onChange={(e) => onInputChange('password', e.target.value)}
          required
          minLength={6}
        />
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={adminData.confirmPassword}
          onChange={(e) => onInputChange('confirmPassword', e.target.value)}
          required
          minLength={6}
        />
        {adminData.confirmPassword && adminData.password !== adminData.confirmPassword && (
          <p className="text-sm text-destructive mt-1">Passwords do not match</p>
        )}
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={loading}
        onClick={() => console.log('🖱️ Button clicked, loading:', loading)}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Account...
          </>
        ) : (
          'Create Admin Account'
        )}
      </Button>
    </form>
  );
};
