import { Category, MultiEntry, VaultItem } from '../types';

/**
 * Safely converts any value (null, undefined, number, object) into a clean string.
 */
export function safeString(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  return '';
}

/**
 * Safely converts any value to lowercase string without throwing TypeError.
 */
export function safeToLowerCase(val: unknown): string {
  return safeString(val).toLowerCase();
}

/**
 * Safely guarantees an array, returning fallback [] if null, undefined, or non-array.
 */
export function safeArray<T>(val: unknown): T[] {
  if (Array.isArray(val)) return val;
  return [];
}

/**
 * Safely compares two strings or items with Arabic and English support.
 */
export function safeLocaleCompare(a: unknown, b: unknown): number {
  const strA = safeString(a);
  const strB = safeString(b);
  return strA.localeCompare(strB, 'ar', { sensitivity: 'base' });
}

/**
 * Normalizes Arabic text: strips Tashkeel, normalizes Alef forms (أ/إ/آ -> ا),
 * Ta Marbuta (ة -> ه), and Alif Maqsura (ى -> ي).
 */
export function normalizeSearchText(text: unknown): string {
  const str = safeToLowerCase(text);
  return str
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove Arabic diacritics / Harakat
    .replace(/[أإآٱ]/g, 'ا') // normalize all Alef variants to basic bare Alif
    .replace(/ة/g, 'ه') // normalize Ta Marbuta
    .replace(/ى/g, 'ي') // normalize Alif Maqsura
    .trim();
}

/**
 * Normalizes any MultiEntry object or malformed entry into a strictly valid MultiEntry:
 * { id: string, label: string, value: string }
 */
export function normalizeMultiEntry(entry: unknown, fallbackIdPrefix: string = 'entry'): MultiEntry {
  if (!entry || typeof entry !== 'object') {
    if (typeof entry === 'string' && entry.trim().length > 0) {
      return {
        id: fallbackIdPrefix,
        label: '',
        value: entry.trim(),
      };
    }
    return {
      id: fallbackIdPrefix,
      label: '',
      value: '',
    };
  }

  const raw = entry as Record<string, unknown>;
  const id = safeString(raw.id).trim() || fallbackIdPrefix;
  const label = safeString(raw.label);
  const value = safeString(raw.value);

  return { id, label, value };
}

/**
 * Normalizes category data with robust fallbacks for glowColor, name, and order.
 */
export function normalizeCategory(cat: unknown): Category {
  if (!cat || typeof cat !== 'object') {
    return {
      id: 'other',
      name: 'عام',
      icon: 'Folder',
      color: 'from-amber-500 to-yellow-600',
      glowColor: 'rgba(234, 179, 8, 0.4)',
      displayOrder: 99,
      isHidden: false,
    };
  }

  const c = cat as Record<string, unknown>;
  const id = safeString(c.id).trim() || 'other';
  const name = safeString(c.name).trim() || 'عام';
  const icon = safeString(c.icon).trim() || 'Folder';
  const color = safeString(c.color).trim() || 'from-amber-500 to-yellow-600';
  let glowColor = safeString(c.glowColor).trim();
  if (!glowColor || !glowColor.startsWith('rgba(')) {
    glowColor = 'rgba(234, 179, 8, 0.4)';
  }

  return {
    id,
    name,
    icon,
    color,
    glowColor,
    displayOrder: typeof c.displayOrder === 'number' ? c.displayOrder : 99,
    isHidden: Boolean(c.isHidden),
  };
}

/**
 * Normalizes a VaultItem ensuring every single field is non-null, valid types,
 * and all MultiEntry arrays contain valid { id, label, value } records.
 */
export function normalizeVaultItem(item: unknown): VaultItem {
  if (!item || typeof item !== 'object') {
    const now = new Date().toISOString();
    return {
      id: `item_${Date.now()}`,
      title: 'سجل جديد',
      description: '',
      category: 'web',
      website: '',
      url: '',
      urls: [],
      username: '',
      email: '',
      password: '',
      apiKeys: [],
      tokens: [],
      secretKeys: [],
      licenseKeys: [],
      certificates: [],
      notes: '',
      secretNotes: '',
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    };
  }

  const raw = item as Record<string, unknown>;

  const id = safeString(raw.id).trim() || `item_${Date.now()}`;
  const title = safeString(raw.title).trim();
  const description = safeString(raw.description);
  const rawCat = typeof raw.category === 'string' ? raw.category.trim() : '';
  const category = rawCat || 'web';
  const website = safeString(raw.website);
  const url = safeString(raw.url);
  const username = safeString(raw.username);
  const email = safeString(raw.email);
  const password = safeString(raw.password);
  const notes = safeString(raw.notes);
  const secretNotes = safeString(raw.secretNotes);
  const isFavorite = Boolean(raw.isFavorite);
  const createdAt = safeString(raw.createdAt) || new Date().toISOString();
  const updatedAt = safeString(raw.updatedAt) || new Date().toISOString();

  // MultiEntry lists normalization
  const urls = safeArray(raw.urls)
    .map((e, idx) => normalizeMultiEntry(e, `url_${idx}`))
    .filter((e) => e.value.length > 0 || e.label.length > 0);

  const apiKeys = safeArray(raw.apiKeys)
    .map((e, idx) => normalizeMultiEntry(e, `key_${idx}`))
    .filter((e) => e.value.length > 0 || e.label.length > 0);

  const tokens = safeArray(raw.tokens)
    .map((e, idx) => normalizeMultiEntry(e, `tok_${idx}`))
    .filter((e) => e.value.length > 0 || e.label.length > 0);

  const secretKeys = safeArray(raw.secretKeys)
    .map((e, idx) => normalizeMultiEntry(e, `sec_${idx}`))
    .filter((e) => e.value.length > 0 || e.label.length > 0);

  const licenseKeys = safeArray(raw.licenseKeys)
    .map((e, idx) => normalizeMultiEntry(e, `lic_${idx}`))
    .filter((e) => e.value.length > 0 || e.label.length > 0);

  const certificates = safeArray(raw.certificates)
    .map((e, idx) => normalizeMultiEntry(e, `cert_${idx}`))
    .filter((e) => e.value.length > 0 || e.label.length > 0);

  return {
    id,
    title,
    description,
    category,
    website,
    url,
    urls,
    username,
    email,
    password,
    apiKeys,
    tokens,
    secretKeys,
    licenseKeys,
    certificates,
    notes,
    secretNotes,
    isFavorite,
    createdAt,
    updatedAt,
  };
}

/**
 * Safely checks if a string or object includes a query string.
 */
export function safeIncludes(source: unknown, query: string): boolean {
  if (!query) return true;
  const cleanSource = safeToLowerCase(source);
  const cleanQuery = safeToLowerCase(query).trim();
  if (!cleanQuery) return true;
  if (cleanSource.includes(cleanQuery)) return true;

  // Normalized search (handles Arabic Alef variants, diacritics, etc.)
  const normSource = normalizeSearchText(cleanSource);
  const normQuery = normalizeSearchText(cleanQuery);
  if (!normQuery) return true;
  return normSource.includes(normQuery);
}

/**
 * Safely tests a MultiEntry array against a search query.
 */
export function safeMatchMultiEntries(entries: unknown, query: string): boolean {
  const arr = safeArray(entries);
  if (arr.length === 0) return false;
  const cleanQuery = safeToLowerCase(query).trim();
  if (!cleanQuery) return true;

  return arr.some((entry) => {
    if (!entry || typeof entry !== 'object') return false;
    const item = entry as Partial<MultiEntry>;
    return (
      safeIncludes(item.label, cleanQuery) ||
      safeIncludes(item.value, cleanQuery) ||
      safeIncludes(item.id, cleanQuery)
    );
  });
}

/**
 * Comprehensive, crash-proof search filter for a VaultItem.
 */
export function matchesSearchQuery(item: unknown, query: string): boolean {
  if (!item || typeof item !== 'object') return false;
  const cleanQuery = safeToLowerCase(query).trim();
  if (!cleanQuery) return true;

  const it = item as Partial<VaultItem>;

  if (safeIncludes(it.title, cleanQuery)) return true;
  if (safeIncludes(it.description, cleanQuery)) return true;
  if (safeIncludes(it.website, cleanQuery)) return true;
  if (safeIncludes(it.url, cleanQuery)) return true;
  if (safeIncludes(it.username, cleanQuery)) return true;
  if (safeIncludes(it.email, cleanQuery)) return true;
  if (safeIncludes(it.notes, cleanQuery)) return true;
  if (safeIncludes(it.secretNotes, cleanQuery)) return true;
  if (safeIncludes(it.category, cleanQuery)) return true;

  if (safeMatchMultiEntries(it.urls, cleanQuery)) return true;
  if (safeMatchMultiEntries(it.apiKeys, cleanQuery)) return true;
  if (safeMatchMultiEntries(it.tokens, cleanQuery)) return true;
  if (safeMatchMultiEntries(it.secretKeys, cleanQuery)) return true;
  if (safeMatchMultiEntries(it.licenseKeys, cleanQuery)) return true;
  if (safeMatchMultiEntries(it.certificates, cleanQuery)) return true;

  return false;
}

/**
 * Safely compares two items by title for Arabic / English sorting.
 */
export function safeLocaleCompareTitle(a: unknown, b: unknown): number {
  const titleA = safeString((a as Partial<VaultItem>)?.title);
  const titleB = safeString((b as Partial<VaultItem>)?.title);
  return safeLocaleCompare(titleA, titleB);
}
