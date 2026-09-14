// AES-256-GCM & PBKDF2 Cryptographic Engine using Web Crypto API
// Compatible with both modern browsers and Tauri desktop environments

export function generateSalt(length: number = 16): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

// SHA-256 PIN Hashing
export async function hashPin(pin: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}::${pin}::AMAN_VAULT_2026`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Derive AES-GCM Key using PBKDF2
export async function deriveKeyFromPin(pin: string, saltHex: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Convert salt hex to Uint8Array
  const saltBytes = new Uint8Array(
    saltHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || [0, 1, 2, 3, 4, 5, 6, 7]
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt plaintext string to IV:Ciphertext Hex
export async function encryptSecret(plainText: string, key: CryptoKey): Promise<string> {
  if (!plainText) return '';
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = enc.encode(plainText);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  const ivHex = Array.from(iv, (b) => b.toString(16).padStart(2, '0')).join('');
  const cipherHex = Array.from(new Uint8Array(cipherBuffer), (b) => b.toString(16).padStart(2, '0')).join('');

  return `ENC:${ivHex}:${cipherHex}`;
}

// Decrypt IV:Ciphertext Hex to plaintext string
export async function decryptSecret(cipherTextWithIv: string, key: CryptoKey): Promise<string> {
  if (!cipherTextWithIv) return '';
  if (!cipherTextWithIv.startsWith('ENC:')) {
    // If not encrypted or legacy plaintext
    return cipherTextWithIv;
  }

  try {
    const parts = cipherTextWithIv.split(':');
    if (parts.length !== 3) return cipherTextWithIv;

    const ivHex = parts[1];
    const cipherHex = parts[2];

    const ivBytes = new Uint8Array(
      ivHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );
    const cipherBytes = new Uint8Array(
      cipherHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBytes },
      key,
      cipherBytes
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    console.error('Decryption failed, key may be incorrect:', err);
    return '*** خطأ في فك التشفير ***';
  }
}

// Encrypted Backup Generator (.aman)
export async function createAmanEncryptedBackup(
  vaultData: object,
  backupPinOrPassword: string
): Promise<Blob> {
  const salt = generateSalt(16);
  const key = await deriveKeyFromPin(backupPinOrPassword, salt);
  const jsonString = JSON.stringify(vaultData);
  const encryptedPayload = await encryptSecret(jsonString, key);

  const backupEnvelope = {
    format: 'AMAN_ENCRYPTED_VAULT',
    version: '2.0.0',
    app: 'AMAN Windows Desktop Vault',
    createdAt: new Date().toISOString(),
    salt,
    payload: encryptedPayload,
    designer: 'تصميم : عبدالله المخلافي 2026',
  };

  return new Blob([JSON.stringify(backupEnvelope, null, 2)], {
    type: 'application/octet-stream',
  });
}

// Generate high-entropy 256-bit random master vault encryption key
export async function generateMasterVaultKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// Export raw key to hex string
export async function exportRawKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key);
  return Array.from(new Uint8Array(raw), (b) => b.toString(16).padStart(2, '0')).join('');
}

// Import raw hex string back to AES-GCM CryptoKey
export async function importRawKey(hex: string): Promise<CryptoKey> {
  const bytes = new Uint8Array(
    hex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
  );
  return crypto.subtle.importKey(
    'raw',
    bytes,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  );
}

// Wrap (encrypt) the random master key with the PIN's Key Encryption Key (KEK)
export async function wrapMasterKey(masterKey: CryptoKey, pinKek: CryptoKey): Promise<string> {
  const rawHex = await exportRawKey(masterKey);
  return encryptSecret(rawHex, pinKek);
}

// Unwrap (decrypt) the random master key using the PIN's Key Encryption Key (KEK)
export async function unwrapMasterKey(wrappedKey: string, pinKek: CryptoKey): Promise<CryptoKey> {
  const rawHex = await decryptSecret(wrappedKey, pinKek);
  if (!rawHex || rawHex.startsWith('***')) {
    throw new Error('فشل فك تشفير المفتاح الرئيسي؛ رمز PIN غير متطابق');
  }
  return importRawKey(rawHex);
}

// Restore Encrypted Backup (.aman)
export async function restoreAmanEncryptedBackup(
  backupJson: string,
  backupPinOrPassword: string
): Promise<any> {
  const envelope = JSON.parse(backupJson);
  if (envelope.format !== 'AMAN_ENCRYPTED_VAULT' || !envelope.payload || !envelope.salt) {
    throw new Error('الملف المحدد ليس نسخة احتياطية مشفرة صالحة لتطبيق أمان.');
  }

  const key = await deriveKeyFromPin(backupPinOrPassword, envelope.salt);
  const decryptedJson = await decryptSecret(envelope.payload, key);
  if (decryptedJson.startsWith('***')) {
    throw new Error('رمز فك تشفير النسخة الاحتياطية غير صحيح.');
  }

  return JSON.parse(decryptedJson);
}
