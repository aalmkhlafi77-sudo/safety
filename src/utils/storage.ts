import { VaultItem, Category, AppSettings } from '../types';
import { db, DEFAULT_CATEGORIES, INITIAL_ITEMS } from './database';

export { DEFAULT_CATEGORIES, INITIAL_ITEMS };

export const STORAGE_KEYS = {
  SQLITE_DB: 'aman_vault_sqlite_binary',
};

// Export raw SQLite binary file (.sqlite) directly for audit / forensics
export async function exportSqliteDatabaseFile(): Promise<void> {
  const binaryData = await db.exportSqliteBinary();
  const blob = new Blob([binaryData as BlobPart], { type: 'application/x-sqlite3' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `aman_vault_${dateStr}.sqlite`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
