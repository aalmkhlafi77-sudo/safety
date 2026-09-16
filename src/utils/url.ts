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

export function sanitizeAndOpenUrl(rawUrl: string): boolean {
  if (!isSafeUrlProtocol(rawUrl)) {
    console.warn('Blocked dangerous or invalid URL:', rawUrl);
    return false;
  }

  let normalized = rawUrl.trim();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }

  try {
    const parsed = new URL(normalized);

    // Check if running in Tauri 2 desktop window with opener capability
    if (typeof window !== 'undefined') {
      const tauriWindow = (window as any).__TAURI__;
      if (tauriWindow?.opener?.openUrl) {
        tauriWindow.opener.openUrl(parsed.href);
        return true;
      }
      // Fallback for browser / standard window
      window.open(parsed.href, '_blank', 'noopener,noreferrer');
      return true;
    }
    return true;
  } catch (err) {
    console.warn('Invalid URL structure');
    return false;
  }
}
