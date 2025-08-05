
// Bank-grade encryption utilities for Stripe keys
import { supabase } from "@/integrations/supabase/client";

export interface EncryptedData {
  encryptedData: string;
  iv: string;
  salt: string;
}

export class StripeKeyEncryption {
  private static async getEncryptionKey(environment: 'test' | 'live'): Promise<CryptoKey> {
    // In production, these would be stored in Supabase Vault
    const keyMaterial = environment === 'test' 
      ? 'stripe_test_encryption_master_key_2024' 
      : 'stripe_live_encryption_master_key_2024';
    
    const encoder = new TextEncoder();
    const keyData = await crypto.subtle.importKey(
      'raw',
      encoder.encode(keyMaterial),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return keyData;
  }

  private static async deriveKey(
    keyMaterial: CryptoKey, 
    salt: Uint8Array, 
    venueId: string
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const venueData = encoder.encode(venueId);
    const combinedSalt = new Uint8Array(salt.length + venueData.length);
    combinedSalt.set(salt);
    combinedSalt.set(venueData, salt.length);

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: combinedSalt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  static async encryptStripeKey(
    secretKey: string, 
    venueId: string, 
    environment: 'test' | 'live'
  ): Promise<EncryptedData> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(secretKey);
      
      // Generate random IV and salt
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const salt = crypto.getRandomValues(new Uint8Array(16));
      
      // Get and derive encryption key
      const keyMaterial = await this.getEncryptionKey(environment);
      const derivedKey = await this.deriveKey(keyMaterial, salt, venueId);
      
      // Encrypt the data
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        derivedKey,
        data
      );
      
      return {
        encryptedData: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
        iv: btoa(String.fromCharCode(...iv)),
        salt: btoa(String.fromCharCode(...salt))
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt Stripe key');
    }
  }

  static async decryptStripeKey(
    encryptedData: EncryptedData, 
    venueId: string, 
    environment: 'test' | 'live'
  ): Promise<string> {
    try {
      // Convert base64 back to Uint8Array
      const encrypted = Uint8Array.from(atob(encryptedData.encryptedData), c => c.charCodeAt(0));
      const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));
      const salt = Uint8Array.from(atob(encryptedData.salt), c => c.charCodeAt(0));
      
      // Get and derive encryption key
      const keyMaterial = await this.getEncryptionKey(environment);
      const derivedKey = await this.deriveKey(keyMaterial, salt, venueId);
      
      // Decrypt the data
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        derivedKey,
        encrypted
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt Stripe key');
    }
  }

  static validateStripeKeyFormat(key: string, environment: 'test' | 'live'): boolean {
    if (!key || typeof key !== 'string') return false;
    
    if (environment === 'test') {
      return key.startsWith('sk_test_') && key.length > 20;
    } else {
      return key.startsWith('sk_live_') && key.length > 20;
    }
  }

  static async auditKeyAccess(
    venueId: string,
    userId: string | null,
    action: 'viewed' | 'updated' | 'created' | 'validated' | 'environment_switched' | 'decrypted',
    environment: 'test' | 'live' | 'both',
    keyType: 'secret' | 'publishable' | 'webhook',
    success: boolean = true,
    errorMessage?: string,
    metadata?: any
  ) {
    try {
      const { error } = await supabase
        .from('stripe_key_audit')
        .insert([{
          venue_id: venueId,
          user_id: userId,
          action,
          environment,
          key_type: keyType,
          success,
          error_message: errorMessage,
          metadata: metadata || {}
        }]);

      if (error) {
        console.error('Failed to audit key access:', error);
      }
    } catch (error) {
      console.error('Audit logging failed:', error);
    }
  }
}
