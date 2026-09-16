export interface MultiEntry {
  id: string;
  label?: string | null;
  value?: string | null;
}

export interface VaultItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  website?: string;
  url?: string;
  urls?: MultiEntry[];
  username?: string;
  email?: string;
  password?: string;
  apiKeys?: MultiEntry[];
  tokens?: MultiEntry[];
  secretKeys?: MultiEntry[];
  licenseKeys?: MultiEntry[];
  certificates?: MultiEntry[];
  notes?: string;
  secretNotes?: string;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  glowColor: string; // Subtle glowing shadow for distinctive visual classification
  displayOrder: number;
  isHidden?: boolean;
}

export interface AppSettings {
  pinHash: string;
  pinSalt: string;
  isPinSet: boolean;
  encryptedMasterKey?: string;
  autoLockMinutes: number; // 1, 5, 10, 30, 0 (0 = never)
  soundEffects: boolean;
  clipboardTimeoutSeconds: number; // 10, 30, 60, 0
  defaultViewMode: 'compact' | 'cards' | 'list';
  lastBackup: string | null;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  itemTitle: string;
  details?: string;
}

export type ViewMode = 'compact' | 'cards' | 'list';
