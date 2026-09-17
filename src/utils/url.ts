import { isTauri } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';

// Safe URL opener for external browser window with strict protocol filtering

export function isSafeUrlProtocol(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;

  const dangerousScheme = /^(javascript|data|file|vbscript|blob|about):/i;
  if (dangerousScheme.test(trimmed)) return false;

  let normalized = trimmed;
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }

  try {
    const parsed = new URL(normalized);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function normalizeUrl(rawUrl: string): string | null {
  if (!isSafeUrlProtocol(rawUrl)) return null;
  let normalized = rawUrl.trim();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }
  try {
    const parsed = new URL(normalized);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
}

export async function sanitizeAndOpenUrl(rawUrl: string): Promise<boolean> {
  const normalizedHref = normalizeUrl(rawUrl);
  if (!normalizedHref) {
    console.warn('Blocked dangerous or invalid URL:', typeof rawUrl === 'string' ? rawUrl.slice(0, 30) : rawUrl);
    return false;
  }

  // 1. Check if running in Tauri desktop environment
  let inTauri = false;
  try {
    inTauri = isTauri();
  } catch {
    inTauri = false;
  }

  if (inTauri) {
    try {
      await openUrl(normalizedHref);
      return true;
    } catch (tauriError) {
      console.error('Failed to open URL using Tauri opener plugin:', tauriError);
      // Optional fallback in case desktop opener encounters issue
      if (typeof window !== 'undefined') {
        try {
          window.open(normalizedHref, '_blank', 'noopener,noreferrer');
          return true;
        } catch (fallbackError) {
          console.error('Fallback window.open also failed:', fallbackError);
        }
      }
      return false;
    }
  }

  // 2. Standard Browser / Google AI Studio Preview environment path
  if (typeof window !== 'undefined') {
    try {
      window.open(normalizedHref, '_blank', 'noopener,noreferrer');
      return true;
    } catch (browserError) {
      console.error('Failed to open URL in browser preview:', browserError);
      return false;
    }
  }

  return false;
}

