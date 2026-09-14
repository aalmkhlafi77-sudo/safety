import React, { useEffect, useState } from 'react';
import { Download, Check, Monitor, Info } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    // Detect if already installed / running in standalone window
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      setShowInfo(true);
    }
  };

  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs font-semibold text-emerald-300">
        <Check className="w-3.5 h-3.5" />
        <span>مثبت على الويندوز</span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstall}
        title="تثبيت التطبيق على سطح المكتب للويندوز"
        className={`vault-btn-3d flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-200 cursor-pointer ${className}`}
      >
        <Monitor className="w-4 h-4 text-amber-400" />
        <span>تثبيت على الويندوز</span>
        <Download className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {/* Guide dialog if deferredPrompt is not yet triggered */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl glass-panel-elevated p-6 border border-slate-700 text-right">
            <div className="flex items-center gap-2 text-base font-bold text-slate-100 mb-2">
              <Info className="w-5 h-5 text-amber-400" />
              <span>كيفية تثبيت التطبيق على الويندوز</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              يمكنك تشغيل هذا التطبيق كنافذة مكتبية مستقلة على نظام ويندوز:
            </p>
            <ol className="list-decimal list-inside text-xs text-slate-300 space-y-2 mb-5 font-medium">
              <li>
                من متصفح <strong className="text-amber-300">Edge</strong> أو <strong className="text-amber-300">Chrome</strong>، انقر على أيقونة التثبيت <Download className="inline w-3.5 h-3.5 text-amber-400" /> في شريط العنوان أعلى الشاشة.
              </li>
              <li>أو افتح قائمة المتصفح (⋮) واختر <strong>"التطبيقات" (Apps)</strong> ثم <strong>"تثبيت هذا الموقع كتطبيق"</strong>.</li>
              <li>سيتم إنشاء اختصار على سطح المكتب وقائمة ابدأ وتعمل الخزنة بشكل كامل دون اتصال بالإنترنت.</li>
            </ol>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
