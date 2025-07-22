
import React, { useState, useCallback } from 'react';
import { Input } from './input';
import { Textarea } from './textarea';
import { InputSanitizer, SecurityValidator } from '@/utils/inputSanitization';
import { Alert, AlertDescription } from './alert';
import { AlertTriangle } from 'lucide-react';

interface SecureInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSecureChange: (value: string) => void;
  inputType?: 'text' | 'email' | 'phone' | 'name' | 'search';
  showSecurityWarnings?: boolean;
}

interface SecureTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onSecureChange: (value: string) => void;
  inputType?: 'richText' | 'notes' | 'text';
  showSecurityWarnings?: boolean;
}

export const SecureInput: React.FC<SecureInputProps> = ({
  onSecureChange,
  inputType = 'text',
  showSecurityWarnings = true,
  onChange,
  ...props
}) => {
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Check for suspicious content
    if (showSecurityWarnings) {
      const suspiciousCheck = SecurityValidator.detectSuspiciousContent(rawValue);
      if (suspiciousCheck.suspicious) {
        setSecurityWarning(suspiciousCheck.reason || 'Suspicious content detected');
        return;
      } else {
        setSecurityWarning(null);
      }
    }

    // Sanitize based on input type
    let sanitizedValue: string;
    switch (inputType) {
      case 'email':
        sanitizedValue = InputSanitizer.sanitizeEmail(rawValue);
        break;
      case 'phone':
        sanitizedValue = InputSanitizer.sanitizePhone(rawValue);
        break;
      case 'name':
        sanitizedValue = InputSanitizer.sanitizeName(rawValue);
        break;
      case 'search':
        sanitizedValue = InputSanitizer.sanitizeSearchQuery(rawValue);
        break;
      default:
        sanitizedValue = InputSanitizer.sanitizeText(rawValue, { maxLength: 1000 });
    }

    onSecureChange(sanitizedValue);
    
    // Call original onChange if provided
    if (onChange) {
      const syntheticEvent = {
        ...e,
        target: { ...e.target, value: sanitizedValue }
      };
      onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
    }
  }, [onSecureChange, inputType, showSecurityWarnings, onChange]);

  return (
    <div className="space-y-2">
      <Input
        {...props}
        onChange={handleChange}
      />
      {securityWarning && showSecurityWarnings && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{securityWarning}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export const SecureTextarea: React.FC<SecureTextareaProps> = ({
  onSecureChange,
  inputType = 'text',
  showSecurityWarnings = true,
  onChange,
  ...props
}) => {
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rawValue = e.target.value;
    
    // Check for suspicious content
    if (showSecurityWarnings) {
      const suspiciousCheck = SecurityValidator.detectSuspiciousContent(rawValue);
      if (suspiciousCheck.suspicious) {
        setSecurityWarning(suspiciousCheck.reason || 'Suspicious content detected');
        return;
      } else {
        setSecurityWarning(null);
      }
    }

    // Sanitize based on input type
    let sanitizedValue: string;
    switch (inputType) {
      case 'richText':
        sanitizedValue = InputSanitizer.sanitizeRichText(rawValue);
        break;
      case 'notes':
        sanitizedValue = InputSanitizer.sanitizeNotes(rawValue);
        break;
      default:
        sanitizedValue = InputSanitizer.sanitizeText(rawValue, { maxLength: 2000 });
    }

    onSecureChange(sanitizedValue);
    
    // Call original onChange if provided
    if (onChange) {
      const syntheticEvent = {
        ...e,
        target: { ...e.target, value: sanitizedValue }
      };
      onChange(syntheticEvent as React.ChangeEvent<HTMLTextAreaElement>);
    }
  }, [onSecureChange, inputType, showSecurityWarnings, onChange]);

  return (
    <div className="space-y-2">
      <Textarea
        {...props}
        onChange={handleChange}
      />
      {securityWarning && showSecurityWarnings && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{securityWarning}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};
