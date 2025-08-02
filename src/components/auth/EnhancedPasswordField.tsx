
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { validatePasswordStrength } from '@/utils/enhancedSecurityUtils';

interface EnhancedPasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  showStrengthIndicator?: boolean;
  required?: boolean;
  id?: string;
}

export const EnhancedPasswordField: React.FC<EnhancedPasswordFieldProps> = ({
  value,
  onChange,
  label = "Password",
  placeholder = "Enter your password",
  showStrengthIndicator = true,
  required = false,
  id = "password"
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  const passwordValidation = validatePasswordStrength(value);

  const getStrengthColor = (score: number) => {
    if (score <= 1) return 'bg-red-500';
    if (score <= 2) return 'bg-orange-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = (score: number) => {
    if (score <= 1) return 'Very Weak';
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Good';
    return 'Strong';
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-slate-200 flex items-center gap-2">
        <Shield className="h-4 w-4" />
        {label}
        {required && <span className="text-red-400">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pr-10"
          placeholder={placeholder}
          required={required}
        />
        
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>

      {showStrengthIndicator && (focused || value.length > 0) && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getStrengthColor(passwordValidation.score)}`}
                style={{ width: `${(passwordValidation.score / 5) * 100}%` }}
              />
            </div>
            <span className={`text-sm font-medium ${
              passwordValidation.score <= 2 ? 'text-red-400' : 
              passwordValidation.score <= 3 ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {getStrengthText(passwordValidation.score)}
            </span>
          </div>
          
          {passwordValidation.feedback.length > 0 && (
            <ul className="text-xs text-slate-400 space-y-1">
              {passwordValidation.feedback.map((feedback, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-slate-400 rounded-full" />
                  {feedback}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
