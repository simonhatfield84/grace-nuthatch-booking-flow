export class SquareTokenEncryption {
  private static async getEncryptionKey(environment: string): Promise<CryptoKey> {
    const keyMaterial = environment === 'sandbox'
      ? 'square_sandbox_encryption_master_key_2024'
      : 'square_production_encryption_master_key_2024';
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keyMaterial);
    
    return await crypto.subtle.importKey(
      'raw',
      keyData,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
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
  
  static async encryptToken(
    token: string,
    venueId: string,
    environment: string
  ): Promise<{ encryptedData: string; iv: string; salt: string }> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const keyMaterial = await this.getEncryptionKey(environment);
    const derivedKey = await this.deriveKey(keyMaterial, salt, venueId);
    
    const encoder = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      derivedKey,
      encoder.encode(token)
    );
    
    return {
      encryptedData: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      iv: btoa(String.fromCharCode(...iv)),
      salt: btoa(String.fromCharCode(...salt))
    };
  }
  
  static async decryptToken(
    encryptedData: { encryptedData: string; iv: string; salt: string },
    venueId: string,
    environment: string
  ): Promise<string> {
    const encrypted = Uint8Array.from(atob(encryptedData.encryptedData), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));
    const salt = Uint8Array.from(atob(encryptedData.salt), c => c.charCodeAt(0));
    
    const keyMaterial = await this.getEncryptionKey(environment);
    const derivedKey = await this.deriveKey(keyMaterial, salt, venueId);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      derivedKey,
      encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }
}
