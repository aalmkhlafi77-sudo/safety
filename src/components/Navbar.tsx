import React from 'react';
import { Shield, Lock, Settings, Volume2, VolumeX, Database, Plus } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  onLock: () => void;
  onOpenSettings: () => void;
  onOpenAddModal: () => void;
  onExport: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  itemCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onLock,
  onOpenSettings,
  onOpenAddModal,
  onExport,
  soundEnabled,
  onToggleSound,
  itemCount,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-3">
        {/* Right: App Logo & Status */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950 border border-slate-600 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_4px_10px_rgba(0,0,0,0.5)]">
            <Shield className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-amber-200 bg-clip-text text-transparent">
                أَمَان
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-600/40 text-[10px] font-bold text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                الخزنة مفتوحة ({itemCount} عنصر)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">قاعدة بيانات محلية لسطح المكتب</p>
          </div>
        </div>

        {/* Left: Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* New Item Button (Gold 3D) */}
          <button
            type="button"
            onClick={onOpenAddModal}
            className="gold-btn-3d flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-950 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>إضافة عنصر</span>
          </button>

          {/* Quick Export / Backup */}
          <button
            type="button"
            onClick={onExport}
            title="تصدير نسخة احتياطية من قاعدة البيانات"
            className="vault-btn-3d hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 cursor-pointer"
          >
            <Database className="w-4 h-4 text-amber-400" />
            <span>تصدير نسخة</span>
          </button>

          {/* Windows Install Button */}
          <div className="hidden lg:block">
            <PWAInstallButton />
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            title={soundEnabled ? 'كتم التأثيرات الصوتية' : 'تفعيل التأثيرات الصوتية'}
            className="vault-btn-3d w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-amber-400 cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Settings / Control Panel */}
          <button
            type="button"
            onClick={onOpenSettings}
            title="لوحة التحكم وتغيير رمز الخزنة"
            className="vault-btn-3d w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-amber-400 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Quick Lock Button */}
          <button
            type="button"
            onClick={onLock}
            title="قفل الخزنة فوراً"
            className="vault-btn-3d flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold text-rose-300 hover:text-rose-200 border-rose-900/40 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">قفل الخزنة</span>
          </button>
        </div>
      </div>
    </header>
  );
};
