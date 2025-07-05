
import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';

interface PasswordStrengthProps {
  password: string;
  onValidityChange?: (isValid: boolean) => void;
}

export function PasswordStrength({ password, onValidityChange }: PasswordStrengthProps) {
  const [strength, setStrength] = useState(0);
  const [checks, setChecks] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  useEffect(() => {
    const newChecks = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    setChecks(newChecks);

    const passedChecks = Object.values(newChecks).filter(Boolean).length;
    setStrength((passedChecks / 5) * 100);

    const isValid = Object.values(newChecks).every(Boolean);
    onValidityChange?.(isValid);
  }, [password, onValidityChange]);

  const getStrengthColor = () => {
    if (strength < 40) return 'bg-red-500';
    if (strength < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (strength < 40) return 'Weak';
    if (strength < 80) return 'Medium';
    return 'Strong';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>Password Strength</span>
        <span className={`font-medium ${strength < 40 ? 'text-red-600' : strength < 80 ? 'text-yellow-600' : 'text-green-600'}`}>
          {getStrengthText()}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
          style={{ width: `${strength}%` }}
        />
      </div>

      <div className="text-xs space-y-1">
        <div className={`flex items-center gap-1 ${checks.length ? 'text-green-600' : 'text-red-600'}`}>
          {checks.length ? '✓' : '✗'} At least 12 characters
        </div>
        <div className={`flex items-center gap-1 ${checks.uppercase ? 'text-green-600' : 'text-red-600'}`}>
          {checks.uppercase ? '✓' : '✗'} One uppercase letter
        </div>
        <div className={`flex items-center gap-1 ${checks.lowercase ? 'text-green-600' : 'text-red-600'}`}>
          {checks.lowercase ? '✓' : '✗'} One lowercase letter
        </div>
        <div className={`flex items-center gap-1 ${checks.number ? 'text-green-600' : 'text-red-600'}`}>
          {checks.number ? '✓' : '✗'} One number
        </div>
        <div className={`flex items-center gap-1 ${checks.special ? 'text-green-600' : 'text-red-600'}`}>
          {checks.special ? '✓' : '✗'} One special character
        </div>
      </div>
    </div>
  );
}
