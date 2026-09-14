import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import initSqlJsAsm from 'sql.js/dist/sql-asm.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { VaultItem, Category, AppSettings, AuditLog, MultiEntry } from '../types';
import {
  encryptSecret,
  decryptSecret,
  hashPin,
  generateSalt,
  deriveKeyFromPin,
  generateMasterVaultKey,
  wrapMasterKey,
  unwrapMasterKey,
} from './crypto';

// Default Categories with distinctive subtle glow lighting
export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'web',
    name: 'مواقع وخدمات ويب',
    icon: 'Globe',
    color: 'from-blue-500 to-indigo-600',
    glowColor: 'rgba(59, 130, 246, 0.35)',
    displayOrder: 1,
  },
  {
    id: 'api',
    name: 'مفاتيح برمجية و API',
    icon: 'Key',
    color: 'from-amber-500 to-orange-600',
    glowColor: 'rgba(245, 158, 11, 0.35)',
    displayOrder: 2,
  },
  {
    id: 'licenses',
    name: 'تراخيص وشهادات',
    icon: 'Award',
    color: 'from-emerald-500 to-teal-600',
    glowColor: 'rgba(16, 185, 129, 0.35)',
    displayOrder: 3,
  },
  {
    id: 'servers',
    name: 'خوادم وسيرفرات',
    icon: 'Server',
    color: 'from-purple-500 to-violet-600',
    glowColor: 'rgba(168, 85, 247, 0.35)',
    displayOrder: 4,
  },
  {
    id: 'banking',
    name: 'بطاقات وحسابات مالية',
    icon: 'CreditCard',
    color: 'from-rose-500 to-red-600',
    glowColor: 'rgba(244, 63, 94, 0.35)',
    displayOrder: 5,
  },
  {
    id: 'general',
    name: 'عام وملاحظات سرية',
    icon: 'ShieldCheck',
    color: 'from-slate-500 to-zinc-600',
    glowColor: 'rgba(148, 163, 184, 0.25)',
    displayOrder: 6,
  },
];

export const INITIAL_ITEMS: VaultItem[] = [
  {
    id: '1',
    title: 'بوابة المطورين - Cloudflare',
    description: 'إدارة نطاقات الويب والحماية السحابية وسجلات DNS',
    category: 'web',
    website: 'Cloudflare',
    url: 'https://dash.cloudflare.com',
    urls: [{ id: 'u1', label: 'لوحة التحكم', value: 'https://dash.cloudflare.com' }],
    username: 'admin@al-makhlafi.com',
    email: 'security@al-makhlafi.com',
    password: 'Cf_Secure#992$Vault',
    apiKeys: [
      { id: 'k1', label: 'Global API Key', value: 'cfa_9f83a8b271d440ea83b190f842cb1a' },
      { id: 'k2', label: 'DNS Edit Token', value: 'v1.0-4a8b7c9e-cld-token-prod' },
    ],
    tokens: [{ id: 't1', label: 'OAuth Token', value: 'cld_tok_991283' }],
    secretKeys: [],
    licenseKeys: [{ id: 'l1', label: 'Enterprise Plan', value: 'CLD-ENT-2026-9941' }],
    certificates: [],
    notes: 'رمز التحقق الثنائي مفعل على تطبيق الأمان.',
    secretNotes: 'مفتاح الاسترداد في الخزنة الفيزيائية رقم 4.',
    isFavorite: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'ترخيص Windows 11 Pro Enterprise',
    description: 'مفتاح تفعيل نظام ويندوز للأجهزة المكتبية للمؤسسة',
    category: 'licenses',
    website: 'Microsoft Volume Licensing',
    url: 'https://admin.microsoft.com',
    urls: [],
    username: 'it-license@makhlafi.local',
    email: 'licenses@makhlafi.local',
    password: 'WinPass#2026!Key',
    apiKeys: [],
    tokens: [],
    secretKeys: [],
    licenseKeys: [
      { id: 'l1', label: 'Product Key (KMS)', value: 'W269N-WFGWX-YVC9B-4J6C9-T83GX' },
      { id: 'l2', label: 'Backup License', value: 'NRG8B-VKK3Q-CXVCJ-9G2XF-6Q84J' },
    ],
    certificates: [{ id: 'c1', label: 'MS OEM Certificate', value: 'CERT-MSFT-2026-X889' }],
    notes: 'شهادة ترخيص معتمدة لـ 50 جهازاً محلياً، تاريخ التجديد 2027.',
    isFavorite: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'خادم الإنتاج الرئيسي - AWS Production',
    description: 'لوحة تحكم خوادم EC2 وقواعد بيانات Aurora في فرانكفورت',
    category: 'servers',
    website: 'AWS Console',
    url: 'https://console.aws.amazon.com',
    urls: [],
    username: 'ops_engineer',
    email: 'devops@al-makhlafi.com',
    password: 'Aws!Prod90#SecuredTitanium',
    apiKeys: [
      { id: 'k1', label: 'Root Access Key', value: 'AKIAIOSFODNN7EXAMPLE' },
      { id: 'k2', label: 'Secret Key', value: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' },
    ],
    tokens: [{ id: 't1', label: 'MFA Session Token', value: 'AQoDYXdzEJr1EXAMPLE' }],
    secretKeys: [],
    licenseKeys: [],
    certificates: [{ id: 'c1', label: 'SSL SHA-256 Cert', value: 'SSL-CERT-DIGICERT-SHA256-EXP2028' }],
    notes: 'الدخول محصور عبر IP المؤسسة المعتمد فقط.',
    secretNotes: 'Private SSH Key موجودة في مجلد الأمان الداخلي.',
    isFavorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'GitHub Enterprise Suite',
    description: 'مستودعات الشيفرات المصدرية وإدارة فرق البرمجة',
    category: 'api',
    website: 'GitHub',
    url: 'https://github.com',
    urls: [],
    username: 'abdullah-almakhlafi',
    email: 'a.almkhlafi77@gmail.com',
    password: 'Gh$Auth2026#VaultLocker',
    apiKeys: [
      { id: 'k1', label: 'Personal Access Token (Repo)', value: 'ghp_4k3m1x9vL7qR8yZa0pBnCwDeF2hJkLmN' },
      { id: 'k2', label: 'Webhook Secret', value: 'whsec_99a8b7c6d5e4f3a2b1' },
    ],
    tokens: [],
    secretKeys: [],
    licenseKeys: [{ id: 'l1', label: 'Enterprise Seat Key', value: 'GH-ENT-USER-KEY-772189' }],
    certificates: [],
    notes: 'مفتاح الـ Personal Access Token يمتلك صلاحيات repo و workflow.',
    isFavorite: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const SQLITE_STORAGE_KEY = 'aman_vault_sqlite_binary';

// Native Tauri IPC bridge helper for Windows desktop app
async function invokeTauri<T>(cmd: string, args?: Record<string, unknown>): Promise<T | null> {
  try {
    if (typeof window !== 'undefined') {
      const w = window as any;
      if (w.__TAURI__?.core?.invoke) {
        return await w.__TAURI__.core.invoke(cmd, args);
      }
      if (w.__TAURI_INTERNALS__?.invoke) {
        return await w.__TAURI_INTERNALS__.invoke(cmd, args);
      }
    }
  } catch (err) {
    console.warn(`Tauri native invoke [${cmd}] skipped:`, err);
  }
  return null;
}

// Safe SQLite engine loader with WebAssembly magic check and pure JS asm.js fallback
async function loadSqlEngine(): Promise<SqlJsStatic> {
  // Strategy 1: Attempt WASM by fetching the buffer and strictly validating magic bytes
  try {
    const wasmUrl = sqlWasmUrl || '/sql-wasm.wasm';
    const response = await fetch(wasmUrl);
    if (response.ok) {
      const wasmBinary = await response.arrayBuffer();
      const magic = new Uint8Array(wasmBinary, 0, 4);
      // Magic bytes for WebAssembly binary: \0asm (0x00, 0x61, 0x73, 0x6d)
      // Ensures that SPA fallback HTML pages ('<!do' = 0x3c 0x21 0x64 0x6f) are never passed to WebAssembly.instantiate
      if (magic[0] === 0x00 && magic[1] === 0x61 && magic[2] === 0x73 && magic[3] === 0x6d) {
        return await initSqlJs({ wasmBinary });
      }
    }
  } catch (wasmErr) {
    console.warn('WASM SQLite loading failed, activating pure JS engine fallback:', wasmErr);
  }

  // Strategy 2: 100% resilient Pure JS Emscripten fallback (sql-asm.js)
  // Completely immune to MIME-type headers, CSP headers, network errors, or iframe sandbox restrictions
  try {
    const initAsm = (initSqlJsAsm as any).default || initSqlJsAsm;
    return await initAsm();
  } catch (asmErr) {
    console.error('Failed to initialize asm.js SQLite fallback:', asmErr);
    throw asmErr;
  }
}

// Real SQLite Database Engine
export class VaultDatabase {
  private sqlDb: Database | null = null;
  private initPromise: Promise<void> | null = null;
  // High-entropy 256-bit random Master Vault Key (held only in memory while unlocked)
  private activeMasterKey: CryptoKey | null = null;

  constructor() {
    this.initPromise = this.initSqlite();
  }

  // Ensure SQLite is initialized and tables exist
  private async ensureInitialized(): Promise<Database> {
    if (this.initPromise) {
      await this.initPromise;
    }
    if (!this.sqlDb) {
      await this.initSqlite();
    }
    return this.sqlDb!;
  }

  private async initSqlite(): Promise<void> {
    try {
      const SQL = await loadSqlEngine();

      // 1. Attempt to load native SQLite binary from Windows AppData if running in desktop Tauri
      let initialBytes: Uint8Array | null = null;
      try {
        const nativeBytes = await invokeTauri<number[]>('load_native_sqlite');
        if (nativeBytes && Array.isArray(nativeBytes) && nativeBytes.length > 0) {
          initialBytes = new Uint8Array(nativeBytes);
        }
      } catch (e) {
        console.warn('Native Tauri SQLite load skipped:', e);
      }

      // 2. If not desktop Tauri or no file yet, attempt to load persisted SQLite binary database
      if (!initialBytes) {
        const persistedBase64 = localStorage.getItem(SQLITE_STORAGE_KEY);
        if (persistedBase64) {
          try {
            const binaryString = atob(persistedBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            initialBytes = bytes;
          } catch (e) {
            console.warn('Could not parse persisted SQLite database, creating new one', e);
          }
        }
      }

      if (initialBytes) {
        this.sqlDb = new SQL.Database(initialBytes);
      } else {
        this.sqlDb = new SQL.Database();
      }

      // Create Schema
      this.sqlDb.run(`
        CREATE TABLE IF NOT EXISTS vault_metadata (
          key TEXT PRIMARY KEY,
          value TEXT
        );

        CREATE TABLE IF NOT EXISTS vault_categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          icon TEXT NOT NULL,
          color TEXT NOT NULL,
          glowColor TEXT NOT NULL,
          displayOrder INTEGER NOT NULL,
          isHidden INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS vault_items (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          category TEXT NOT NULL,
          website TEXT,
          url TEXT,
          urls_json TEXT,
          username TEXT,
          email TEXT,
          password TEXT,
          apiKeys_json TEXT,
          tokens_json TEXT,
          secretKeys_json TEXT,
          licenseKeys_json TEXT,
          certificates_json TEXT,
          notes TEXT,
          secretNotes TEXT,
          isFavorite INTEGER DEFAULT 0,
          createdAt TEXT,
          updatedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS vault_audit_logs (
          id TEXT PRIMARY KEY,
          timestamp TEXT NOT NULL,
          action TEXT NOT NULL,
          itemTitle TEXT NOT NULL,
          details TEXT
        );
      `);

      // Verify if categories exist, if not seed defaults
      const catCountRes = this.sqlDb.exec('SELECT COUNT(*) FROM vault_categories;');
      const catCount = catCountRes[0]?.values[0]?.[0] as number;
      if (!catCount || catCount === 0) {
        const stmt = this.sqlDb.prepare(
          'INSERT INTO vault_categories (id, name, icon, color, glowColor, displayOrder, isHidden) VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        for (const cat of DEFAULT_CATEGORIES) {
          stmt.run([cat.id, cat.name, cat.icon, cat.color, cat.glowColor, cat.displayOrder, cat.isHidden ? 1 : 0]);
        }
        stmt.free();
      }

      this.persistToDisk();
    } catch (err) {
      console.error('Failed to initialize SQLite database:', err);
      throw err;
    }
  }

  // Persist SQLite binary database (both native disk file on Windows Tauri & local storage)
  private persistToDisk(): void {
    if (!this.sqlDb) return;
    try {
      const binary = this.sqlDb.export();

      // If running inside Tauri Desktop Windows app, save directly to native Windows filesystem
      invokeTauri('save_native_sqlite', { data: Array.from(binary) }).catch((err) => {
        console.warn('Native Windows SQLite disk save skipped:', err);
      });

      let binaryString = '';
      const len = binary.length;
      const chunkSize = 8192;
      for (let i = 0; i < len; i += chunkSize) {
        const chunk = binary.subarray(i, Math.min(i + chunkSize, len));
        binaryString += String.fromCharCode.apply(null, chunk as any);
      }
      const b64 = btoa(binaryString);
      localStorage.setItem(SQLITE_STORAGE_KEY, b64);
    } catch (e) {
      console.error('Error persisting SQLite database:', e);
    }
  }

  // Export raw SQLite binary for external file creation or audit
  async exportSqliteBinary(): Promise<Uint8Array> {
    const db = await this.ensureInitialized();
    return db.export();
  }

  // Set active 256-bit random master key in memory
  setActiveKey(key: CryptoKey | null) {
    this.activeMasterKey = key;
  }

  getActiveKey(): CryptoKey | null {
    return this.activeMasterKey;
  }

  // Settings Management via SQLite metadata
  async getSettings(): Promise<AppSettings> {
    const db = await this.ensureInitialized();
    const res = db.exec("SELECT value FROM vault_metadata WHERE key = 'settings';");
    if (res.length > 0 && res[0].values.length > 0) {
      try {
        const json = res[0].values[0][0] as string;
        return JSON.parse(json);
      } catch (e) {
        console.error('Error parsing settings from SQLite:', e);
      }
    }

    // Default first-run settings
    const salt = generateSalt(16);
    const initialSettings: AppSettings = {
      pinHash: '',
      pinSalt: salt,
      isPinSet: false,
      autoLockMinutes: 10,
      soundEffects: true,
      clipboardTimeoutSeconds: 30,
      defaultViewMode: 'cards',
      lastBackup: null,
    };
    await this.saveSettings(initialSettings);
    return initialSettings;
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    const db = await this.ensureInitialized();
    const stmt = db.prepare("INSERT OR REPLACE INTO vault_metadata (key, value) VALUES ('settings', ?);");
    stmt.run([JSON.stringify(settings)]);
    stmt.free();
    this.persistToDisk();
  }

  // Set new PIN: Generates high-entropy 256-bit master key, derives PIN KEK, wraps master key
  async updatePin(newPin: string): Promise<AppSettings> {
    const db = await this.ensureInitialized();
    const current = await this.getSettings();
    const salt = generateSalt(16);
    const hash = await hashPin(newPin, salt);

    // 1. Generate strong 256-bit random master key if none exists
    let masterKey = this.activeMasterKey;
    if (!masterKey) {
      masterKey = await generateMasterVaultKey();
    }

    // 2. Derive Key Encryption Key (KEK) from PIN
    const pinKek = await deriveKeyFromPin(newPin, salt);

    // 3. Wrap (encrypt) 256-bit master key with PIN KEK
    const wrappedMasterKey = await wrapMasterKey(masterKey, pinKek);

    const updated: AppSettings = {
      ...current,
      pinHash: hash,
      pinSalt: salt,
      isPinSet: true,
      encryptedMasterKey: wrappedMasterKey,
    };

    await this.saveSettings(updated);
    this.setActiveKey(masterKey);

    // If there are initial items not yet saved in SQLite, encrypt & save them with master key
    const itemsCountRes = db.exec('SELECT COUNT(*) FROM vault_items;');
    const count = itemsCountRes[0]?.values[0]?.[0] as number;
    if (!count || count === 0) {
      await this.saveItems(INITIAL_ITEMS);
    }

    await this.addAuditLog('تحديث الرمز السري', 'تم تشفير وحماية مفتاح الخزنة العشوائي بواسطة رمز PIN بنجاح');
    return updated;
  }

  // Verify PIN & Unwrap the 256-bit random Master Key
  async verifyPin(enteredPin: string): Promise<boolean> {
    const settings = await this.getSettings();
    if (!settings.isPinSet || !settings.pinHash) {
      return false;
    }

    const computedHash = await hashPin(enteredPin, settings.pinSalt);
    if (computedHash === settings.pinHash) {
      try {
        // Derive KEK from PIN
        const pinKek = await deriveKeyFromPin(enteredPin, settings.pinSalt);

        if (settings.encryptedMasterKey) {
          // Unwrap master key
          const masterKey = await unwrapMasterKey(settings.encryptedMasterKey, pinKek);
          this.setActiveKey(masterKey);
        } else {
          // Legacy upgrade: Generate and wrap master key
          const masterKey = await generateMasterVaultKey();
          const wrapped = await wrapMasterKey(masterKey, pinKek);
          settings.encryptedMasterKey = wrapped;
          await this.saveSettings(settings);
          this.setActiveKey(masterKey);
        }
        return true;
      } catch (err) {
        console.error('Error unwrapping master vault key:', err);
        return false;
      }
    }
    return false;
  }

  // Categories in SQLite
  async getCategories(): Promise<Category[]> {
    const db = await this.ensureInitialized();
    const res = db.exec('SELECT id, name, icon, color, glowColor, displayOrder, isHidden FROM vault_categories ORDER BY displayOrder ASC;');
    if (!res.length || !res[0].values.length) {
      return DEFAULT_CATEGORIES;
    }

    return res[0].values.map((row) => ({
      id: row[0] as string,
      name: row[1] as string,
      icon: row[2] as string,
      color: row[3] as string,
      glowColor: row[4] as string,
      displayOrder: row[5] as number,
      isHidden: Boolean(row[6]),
    }));
  }

  async saveCategories(categories: Category[]): Promise<void> {
    const db = await this.ensureInitialized();
    db.run('BEGIN TRANSACTION;');
    db.run('DELETE FROM vault_categories;');
    const stmt = db.prepare(
      'INSERT INTO vault_categories (id, name, icon, color, glowColor, displayOrder, isHidden) VALUES (?, ?, ?, ?, ?, ?, ?);'
    );
    for (let i = 0; i < categories.length; i++) {
      const c = categories[i];
      stmt.run([c.id, c.name, c.icon, c.color, c.glowColor, c.displayOrder || i + 1, c.isHidden ? 1 : 0]);
    }
    stmt.free();
    db.run('COMMIT;');
    this.persistToDisk();
  }

  // Vault Items in SQLite (All sensitive fields strictly AES-GCM Encrypted)
  async getItems(): Promise<VaultItem[]> {
    const db = await this.ensureInitialized();
    const res = db.exec(`
      SELECT 
        id, title, description, category, website, url, urls_json, 
        username, email, password, apiKeys_json, tokens_json, 
        secretKeys_json, licenseKeys_json, certificates_json, 
        notes, secretNotes, isFavorite, createdAt, updatedAt
      FROM vault_items;
    `);

    if (!res.length || !res[0].values.length) {
      return [];
    }

    const rows = res[0].values;
    const items: VaultItem[] = [];

    for (const row of rows) {
      const rawPassword = (row[9] as string) || '';
      const rawSecretNotes = (row[16] as string) || '';
      const rawUrls = (row[6] as string) || '[]';
      const rawApiKeys = (row[10] as string) || '[]';
      const rawTokens = (row[11] as string) || '[]';
      const rawSecretKeys = (row[12] as string) || '[]';
      const rawLicenseKeys = (row[13] as string) || '[]';
      const rawCertificates = (row[14] as string) || '[]';

      let decPassword = '••••••••';
      let decSecretNotes = '';
      let decApiKeys: MultiEntry[] = [];
      let decTokens: MultiEntry[] = [];
      let decSecretKeys: MultiEntry[] = [];
      let decLicenseKeys: MultiEntry[] = [];
      let decCertificates: MultiEntry[] = [];

      let parsedUrls: MultiEntry[] = [];
      try {
        parsedUrls = JSON.parse(rawUrls);
      } catch {
        parsedUrls = [];
      }

      if (this.activeMasterKey) {
        // Decrypt password
        decPassword = rawPassword.startsWith('ENC:')
          ? await decryptSecret(rawPassword, this.activeMasterKey)
          : rawPassword;

        // Decrypt secret notes
        decSecretNotes = rawSecretNotes.startsWith('ENC:')
          ? await decryptSecret(rawSecretNotes, this.activeMasterKey)
          : rawSecretNotes;

        // Decrypt multi-value entries
        try {
          const apiList: MultiEntry[] = JSON.parse(rawApiKeys);
          decApiKeys = await Promise.all(
            apiList.map(async (k) => ({
              ...k,
              value: k.value?.startsWith('ENC:')
                ? await decryptSecret(k.value, this.activeMasterKey!)
                : k.value,
            }))
          );
        } catch {
          decApiKeys = [];
        }

        try {
          const tokList: MultiEntry[] = JSON.parse(rawTokens);
          decTokens = await Promise.all(
            tokList.map(async (t) => ({
              ...t,
              value: t.value?.startsWith('ENC:')
                ? await decryptSecret(t.value, this.activeMasterKey!)
                : t.value,
            }))
          );
        } catch {
          decTokens = [];
        }

        try {
          const secList: MultiEntry[] = JSON.parse(rawSecretKeys);
          decSecretKeys = await Promise.all(
            secList.map(async (s) => ({
              ...s,
              value: s.value?.startsWith('ENC:')
                ? await decryptSecret(s.value, this.activeMasterKey!)
                : s.value,
            }))
          );
        } catch {
          decSecretKeys = [];
        }

        try {
          const licList: MultiEntry[] = JSON.parse(rawLicenseKeys);
          decLicenseKeys = await Promise.all(
            licList.map(async (l) => ({
              ...l,
              value: l.value?.startsWith('ENC:')
                ? await decryptSecret(l.value, this.activeMasterKey!)
                : l.value,
            }))
          );
        } catch {
          decLicenseKeys = [];
        }

        try {
          const certList: MultiEntry[] = JSON.parse(rawCertificates);
          decCertificates = await Promise.all(
            certList.map(async (c) => ({
              ...c,
              value: c.value?.startsWith('ENC:')
                ? await decryptSecret(c.value, this.activeMasterKey!)
                : c.value,
            }))
          );
        } catch {
          decCertificates = [];
        }
      }

      items.push({
        id: row[0] as string,
        title: row[1] as string,
        description: (row[2] as string) || '',
        category: row[3] as string,
        website: (row[4] as string) || '',
        url: (row[5] as string) || '',
        urls: parsedUrls,
        username: (row[7] as string) || '',
        email: (row[8] as string) || '',
        password: decPassword,
        apiKeys: decApiKeys,
        tokens: decTokens,
        secretKeys: decSecretKeys,
        licenseKeys: decLicenseKeys,
        certificates: decCertificates,
        notes: (row[15] as string) || '',
        secretNotes: decSecretNotes,
        isFavorite: Boolean(row[17]),
        createdAt: (row[18] as string) || new Date().toISOString(),
        updatedAt: (row[19] as string) || new Date().toISOString(),
      });
    }

    return items;
  }

  // Save items in SQLite: All sensitive fields are encrypted with the 256-bit random master key before SQL INSERT
  async saveItems(items: VaultItem[]): Promise<void> {
    const db = await this.ensureInitialized();
    db.run('BEGIN TRANSACTION;');
    db.run('DELETE FROM vault_items;');

    const stmt = db.prepare(`
      INSERT INTO vault_items (
        id, title, description, category, website, url, urls_json,
        username, email, password, apiKeys_json, tokens_json,
        secretKeys_json, licenseKeys_json, certificates_json,
        notes, secretNotes, isFavorite, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    for (const item of items) {
      let encPassword = item.password;
      let encSecretNotes = item.secretNotes || '';

      if (this.activeMasterKey) {
        if (item.password && !item.password.startsWith('ENC:')) {
          encPassword = await encryptSecret(item.password, this.activeMasterKey);
        }
        if (item.secretNotes && !item.secretNotes.startsWith('ENC:')) {
          encSecretNotes = await encryptSecret(item.secretNotes, this.activeMasterKey);
        }
      }

      // Encrypt multi-values
      const encApiKeys = this.activeMasterKey && Array.isArray(item.apiKeys)
        ? await Promise.all(
            item.apiKeys.map(async (k) => ({
              ...k,
              value: k.value && !k.value.startsWith('ENC:')
                ? await encryptSecret(k.value, this.activeMasterKey!)
                : k.value,
            }))
          )
        : item.apiKeys || [];

      const encTokens = this.activeMasterKey && Array.isArray(item.tokens)
        ? await Promise.all(
            item.tokens.map(async (t) => ({
              ...t,
              value: t.value && !t.value.startsWith('ENC:')
                ? await encryptSecret(t.value, this.activeMasterKey!)
                : t.value,
            }))
          )
        : item.tokens || [];

      const encSecretKeys = this.activeMasterKey && Array.isArray(item.secretKeys)
        ? await Promise.all(
            item.secretKeys.map(async (s) => ({
              ...s,
              value: s.value && !s.value.startsWith('ENC:')
                ? await encryptSecret(s.value, this.activeMasterKey!)
                : s.value,
            }))
          )
        : item.secretKeys || [];

      const encLicenses = this.activeMasterKey && Array.isArray(item.licenseKeys)
        ? await Promise.all(
            item.licenseKeys.map(async (l) => ({
              ...l,
              value: l.value && !l.value.startsWith('ENC:')
                ? await encryptSecret(l.value, this.activeMasterKey!)
                : l.value,
            }))
          )
        : item.licenseKeys || [];

      const encCerts = this.activeMasterKey && Array.isArray(item.certificates)
        ? await Promise.all(
            item.certificates.map(async (c) => ({
              ...c,
              value: c.value && !c.value.startsWith('ENC:')
                ? await encryptSecret(c.value, this.activeMasterKey!)
                : c.value,
            }))
          )
        : item.certificates || [];

      stmt.run([
        item.id,
        item.title,
        item.description || '',
        item.category,
        item.website || '',
        item.url || '',
        JSON.stringify(item.urls || []),
        item.username || '',
        item.email || '',
        encPassword,
        JSON.stringify(encApiKeys),
        JSON.stringify(encTokens),
        JSON.stringify(encSecretKeys),
        JSON.stringify(encLicenses),
        JSON.stringify(encCerts),
        item.notes || '',
        encSecretNotes,
        item.isFavorite ? 1 : 0,
        item.createdAt || new Date().toISOString(),
        item.updatedAt || new Date().toISOString(),
      ]);
    }

    stmt.free();
    db.run('COMMIT;');
    this.persistToDisk();
  }

  // Audit Logs in SQLite
  async getAuditLogs(): Promise<AuditLog[]> {
    const db = await this.ensureInitialized();
    const res = db.exec('SELECT id, timestamp, action, itemTitle, details FROM vault_audit_logs ORDER BY timestamp DESC LIMIT 100;');
    if (!res.length || !res[0].values.length) return [];

    return res[0].values.map((row) => ({
      id: row[0] as string,
      timestamp: row[1] as string,
      action: row[2] as string,
      itemTitle: row[3] as string,
      details: (row[4] as string) || undefined,
    }));
  }

  async addAuditLog(action: string, itemTitle: string, details?: string): Promise<void> {
    const db = await this.ensureInitialized();
    const stmt = db.prepare('INSERT INTO vault_audit_logs (id, timestamp, action, itemTitle, details) VALUES (?, ?, ?, ?, ?);');
    stmt.run([Date.now().toString(), new Date().toISOString(), action, itemTitle, details || '']);
    stmt.free();
    this.persistToDisk();
  }

  async clearAuditLogs(): Promise<void> {
    const db = await this.ensureInitialized();
    db.run('DELETE FROM vault_audit_logs;');
    this.persistToDisk();
  }

  // Change PIN & Re-wrap master key
  async changeMasterPin(oldPin: string, newPin: string): Promise<boolean> {
    const isValid = await this.verifyPin(oldPin);
    if (!isValid || !this.activeMasterKey) return false;

    // Derive new KEK and re-wrap master key
    const current = await this.getSettings();
    const newSalt = generateSalt(16);
    const newHash = await hashPin(newPin, newSalt);
    const newPinKek = await deriveKeyFromPin(newPin, newSalt);
    const reWrappedMasterKey = await wrapMasterKey(this.activeMasterKey, newPinKek);

    const updated: AppSettings = {
      ...current,
      pinHash: newHash,
      pinSalt: newSalt,
      encryptedMasterKey: reWrappedMasterKey,
    };
    await this.saveSettings(updated);

    await this.addAuditLog('تغيير الرمز السري', 'تم تحديث رمز PIN وإعادة تغليف مفتاح التشفير الرئيسي بأمان');
    return true;
  }

  // Export Encrypted .aman backup container
  async exportAmanBackup(): Promise<string> {
    if (!this.activeMasterKey) throw new Error('الخزنة مقفلة، لا يمكن التصدير');
    const items = await this.getItems();
    const categories = await this.getCategories();
    const settings = await this.getSettings();

    const payload = JSON.stringify({
      items,
      categories,
      exportedAt: new Date().toISOString(),
      version: '2.0.0',
    });

    const encryptedPayload = await encryptSecret(payload, this.activeMasterKey);

    const backupObj = {
      format: 'AMAN_ENCRYPTED_VAULT',
      version: '2.0.0',
      app: 'AMAN Windows Desktop Vault',
      exportedAt: new Date().toISOString(),
      encryptedPayload,
      salt: settings.pinSalt,
      designer: 'تصميم : عبدالله المخلافي 2026',
    };

    await this.addAuditLog('تصدير مشفر', 'تم تصدير نسخة احتياطية مشفرة (.aman)');
    return JSON.stringify(backupObj, null, 2);
  }

  // Import Encrypted .aman backup container
  async importAmanBackup(jsonString: string): Promise<{ itemsCount: number; categoriesCount: number }> {
    if (!this.activeMasterKey) throw new Error('الخزنة مقفلة، يرجى فتح الخزنة أولاً');
    const parsed = JSON.parse(jsonString);
    if (!parsed.encryptedPayload) throw new Error('الملف المحدد لا يحتوي على حزمة مشفرة صالحة');

    const decryptedPayload = await decryptSecret(parsed.encryptedPayload, this.activeMasterKey);
    if (!decryptedPayload || decryptedPayload.startsWith('***')) {
      throw new Error('فشل فك التشفير. تأكد من أن رمز PIN الحالي يطابق الرمز المستخدم عند إنشاء النسخة الاحتياطية');
    }

    const data = JSON.parse(decryptedPayload);
    if (!Array.isArray(data.items)) throw new Error('بيانات السجلات في الملف غير صالحة');

    await this.saveItems(data.items);
    if (Array.isArray(data.categories)) {
      await this.saveCategories(data.categories);
    }

    await this.addAuditLog('استيراد مشفر', `تم استيراد واستعادة ${data.items.length} سجل بنجاح من ملف .aman`);
    return { itemsCount: data.items.length, categoriesCount: data.categories?.length || 0 };
  }

  // Reset entire database back to pristine initial state (Requires PIN verification)
  async resetDatabase(enteredPin: string): Promise<boolean> {
    const isValid = await this.verifyPin(enteredPin);
    if (!isValid) {
      return false;
    }

    const db = await this.ensureInitialized();
    db.run('BEGIN TRANSACTION;');
    db.run('DELETE FROM vault_items;');
    db.run('DELETE FROM vault_categories;');
    db.run('DELETE FROM vault_audit_logs;');
    db.run('COMMIT;');

    await this.saveCategories(DEFAULT_CATEGORIES);
    await this.saveItems(INITIAL_ITEMS);
    await this.addAuditLog('تصفير الخزنة', 'تم تصفير وإعادة تعيين قاعدة بيانات SQLite بنجاح');
    return true;
  }

  // Generate 100 realistic test records for performance & layout verification (Requirement 14)
  async generate100TestItems(): Promise<number> {
    if (!this.activeMasterKey) throw new Error('الخزنة مقفلة');
    const categories = ['web', 'api', 'licenses', 'servers', 'banking', 'general'];
    const titles = [
      'بوابة الدفع الإلكتروني', 'سيرفر لينكس أوبونتو', 'مفتاح ترخيص Visual Studio',
      'حساب AWS للخدمات السحابية', 'واجهة برمجة تطبيقات Stripe', 'مستودع كود GitLab',
      'حساب مصرفي - البنك الأهلي', 'ترخيص Windows Server 2025', 'مفتاح الذكاء الاصطناعي Gemini API',
      'سيرفر قاعدة بيانات PostgreSQL', 'بوابة النطاقات GoDaddy', 'شهادة أمان SSL Wildcard',
      'حساب الدعم الفني Jira', 'خادم النسخ الاحتياطي Synology', 'ترخيص Adobe Creative Cloud'
    ];

    const new100Items: VaultItem[] = [];
    const now = Date.now();

    for (let i = 1; i <= 100; i++) {
      const cat = categories[i % categories.length];
      const baseTitle = titles[i % titles.length];
      const id = `test_${now}_${i}`;
      new100Items.push({
        id,
        title: `${baseTitle} #${i}`,
        description: `سجل تجريبي رقم ${i} لاختبار الأداء وأوضاع العرض على شاشات سطح المكتب ويندوز`,
        category: cat,
        website: `Service-${i}.local`,
        url: `https://service-${i}.internal.network`,
        urls: [{ id: `u_${i}`, label: 'الرابط المباشر', value: `https://service-${i}.internal.network` }],
        username: `admin_user_${i}`,
        email: `ops_${i}@al-makhlafi.local`,
        password: `SecPass!${i*79}#VaultKey`,
        apiKeys: [{ id: `k_${i}`, label: `API Key v${(i % 3) + 1}`, value: `sk_test_${i}fa89b2c4e1d7023` }],
        tokens: [{ id: `t_${i}`, label: 'Auth Token', value: `tok_${i}_a89d71c` }],
        secretKeys: [],
        licenseKeys: [{ id: `l_${i}`, label: 'License Key', value: `LIC-TEST-2026-${1000 + i}` }],
        certificates: [{ id: `c_${i}`, label: 'Cert SHA-256', value: `CERT-AMN-2026-X${i}` }],
        notes: `ملاحظات فنية لسجل الاختبار رقم ${i}، التحقق الدوري مفعل.`,
        secretNotes: `بيانات تشفير سرية إضافية للسجل ${i}`,
        isFavorite: i % 5 === 0,
        createdAt: new Date(now - i * 3600000).toISOString(),
        updatedAt: new Date(now - i * 1800000).toISOString(),
      });
    }

    const currentItems = await this.getItems();
    const merged = [...new100Items, ...currentItems];
    await this.saveItems(merged);
    await this.addAuditLog('توليد سجلات تجريبية', `تم توليد ${new100Items.length} سجل تجريبي لاختبار أوضاع العرض`);
    return new100Items.length;
  }
}

export const db = new VaultDatabase();
