// Secure Clipboard Utility with configurable auto-clearing for sensitive secrets

let activeClearTimer: any = null;

export async function copySensitiveText(
  text: string,
  timeoutSeconds: number = 30,
  onCopied?: () => void,
  onCleared?: () => void
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    if (onCopied) onCopied();

    // Clear previous timer if any
    if (activeClearTimer) {
      clearTimeout(activeClearTimer);
      activeClearTimer = null;
    }

    if (timeoutSeconds > 0) {
      activeClearTimer = setTimeout(async () => {
        try {
          // Check if clipboard still contains the sensitive text, then clear
          const current = await navigator.clipboard.readText();
          if (current === text) {
            await navigator.clipboard.writeText('');
            if (onCleared) onCleared();
          }
        } catch {
          // If readText is blocked, still overwrite with empty string
          try {
            await navigator.clipboard.writeText('');
            if (onCleared) onCleared();
          } catch {}
        }
      }, timeoutSeconds * 1000);
    }
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

export async function copyPlainText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}
