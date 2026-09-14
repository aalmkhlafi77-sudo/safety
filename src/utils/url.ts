// Safe URL opener for external browser window

export function sanitizeAndOpenUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;

  let trimmed = rawUrl.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      alert('الرابط غير آمن أو غير صالح.');
      return false;
    }

    // Check if running in Tauri 2 desktop window
    const tauriWindow = (window as any).__TAURI__;
    if (tauriWindow?.opener?.openUrl) {
      tauriWindow.opener.openUrl(parsed.href);
      return true;
    }

    // Fallback for browser / standard window
    window.open(parsed.href, '_blank', 'noopener,noreferrer');
    return true;
  } catch {
    alert('عنوان الرابط الإلكتروني غير صالح.');
    return false;
  }
}
