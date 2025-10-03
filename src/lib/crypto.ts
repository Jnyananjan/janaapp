/**
 * Client-side cryptography utilities for E2E encryption
 * Implements RSA-OAEP for asymmetric encryption and AES-GCM for password encryption
 */

// Generate RSA key pair for E2E encryption
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
}

// Export public key to base64 string
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("spki", key);
  return arrayBufferToBase64(exported);
}

// Export private key to base64 string
export async function exportPrivateKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("pkcs8", key);
  return arrayBufferToBase64(exported);
}

// Import public key from base64 string
export async function importPublicKey(keyData: string): Promise<CryptoKey> {
  const buffer = base64ToArrayBuffer(keyData);
  return await window.crypto.subtle.importKey(
    "spki",
    buffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );
}

// Import private key from base64 string
export async function importPrivateKey(keyData: string): Promise<CryptoKey> {
  const buffer = base64ToArrayBuffer(keyData);
  return await window.crypto.subtle.importKey(
    "pkcs8",
    buffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"]
  );
}

// Derive encryption key from password using PBKDF2
async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// Encrypt private key with password
export async function encryptPrivateKey(privateKey: string, password: string): Promise<string> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyFromPassword(password, salt);

  const encoder = new TextEncoder();
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encoder.encode(privateKey)
  );

  // Combine salt + iv + encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  return arrayBufferToBase64(combined.buffer);
}

// Decrypt private key with password
export async function decryptPrivateKey(encryptedKey: string, password: string): Promise<string> {
  const combined = base64ToArrayBuffer(encryptedKey);
  const data = new Uint8Array(combined);

  const salt = data.slice(0, 16);
  const iv = data.slice(16, 28);
  const encrypted = data.slice(28);

  const key = await deriveKeyFromPassword(password, salt);

  try {
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    throw new Error("Invalid password");
  }
}

// Encrypt message with recipient's public key
export async function encryptMessage(message: string, publicKey: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    publicKey,
    data
  );

  return arrayBufferToBase64(encrypted);
}

// Decrypt message with private key
export async function decryptMessage(encryptedMessage: string, privateKey: CryptoKey): Promise<string> {
  const data = base64ToArrayBuffer(encryptedMessage);

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    privateKey,
    data
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// Hash password for storage (not used for encryption)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await window.crypto.subtle.digest("SHA-256", data);
  return arrayBufferToBase64(hash);
}

// Utility functions
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
