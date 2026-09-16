// Safe Runtime Diagnostics for AMAN Vault
// Strictly filters out any PIN, password, cryptographic keys, tokens, or personal secrets

interface DiagnosticLog {
  timestamp: string;
  type: 'error' | 'rejection';
  message: string;
}

const diagnosticLogs: DiagnosticLog[] = [];
const MAX_LOGS = 10;

function redactSensitiveData(raw: string): string {
  if (!raw) return '';
  // Redact hex keys (like 64-char or 32-char hex)
  let cleaned = raw.replace(/[a-fA-F0-9]{32,}/g, '[REDACTED_HEX_KEY]');
  // Redact tokens/api keys
  cleaned = cleaned.replace(/(ghp_|sk_|cfa_|cld_|whsec_|ENC:)[a-zA-Z0-9_\-\:]+/g, '$1[REDACTED]');
  // Redact PIN sequences (4-8 digits surrounded by delimiters or words)
  cleaned = cleaned.replace(/(pin[:=\s]+)\d{4,8}/gi, '$1[REDACTED_PIN]');
  cleaned = cleaned.replace(/(password[:=\s]+)\S+/gi, '$1[REDACTED_PASS]');
  return cleaned;
}

export function initRuntimeDiagnostics(): void {
  if (typeof window === 'undefined') return;

  // Unregister any stale Service Worker from browser cache if present
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().catch(() => {});
      }
    }).catch(() => {});
  }

  // Safe window error handler
  window.addEventListener('error', (event) => {
    const safeMsg = redactSensitiveData(event.message || 'Script error');
    if (diagnosticLogs.length >= MAX_LOGS) {
      diagnosticLogs.shift();
    }
    diagnosticLogs.push({
      timestamp: new Date().toISOString(),
      type: 'error',
      message: safeMsg,
    });
    // Never re-log raw error to console if in production
    if (import.meta.env.DEV) {
      console.warn('[SafeDiagnostic Error]:', safeMsg);
    }
  });

  // Safe unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = typeof event.reason === 'object' ? event.reason?.message || 'Promise rejected' : String(event.reason);
    const safeReason = redactSensitiveData(reasonStr);
    if (diagnosticLogs.length >= MAX_LOGS) {
      diagnosticLogs.shift();
    }
    diagnosticLogs.push({
      timestamp: new Date().toISOString(),
      type: 'rejection',
      message: safeReason,
    });
    if (import.meta.env.DEV) {
      console.warn('[SafeDiagnostic Rejection]:', safeReason);
    }
  });
}

export function getSanitizedDiagnostics(): ReadonlyArray<DiagnosticLog> {
  return diagnosticLogs;
}
