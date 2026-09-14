import React from 'react';
import { Shield, Lock, Sparkles, Monitor, Cpu, KeyRound } from 'lucide-react';
import { motion } from 'motion/react';
import { VaultKeypad } from './VaultKeypad';
import { FloatingParticles } from './FloatingParticles';
import heroImage from '../assets/images/vault_safe_hero_1789415596840.jpg';

interface LoginViewProps {
  isPinSet: boolean;
  onUnlockWithPin?: (pin: string) => Promise<boolean>;
  onSetupPin?: (pin: string) => Promise<void> | void;
  onUnlock?: (pin: string) => void;
  onVerifyPin?: (pin: string) => Promise<boolean>;
}

export const LoginView: React.FC<LoginViewProps> = ({
  isPinSet,
  onUnlockWithPin,
  onSetupPin,
  onUnlock,
  onVerifyPin,
}) => {
  const handleKeypadSuccess = (completedPin: string) => {
    if (!isPinSet) {
      if (typeof onSetupPin === 'function') {
        onSetupPin(completedPin);
      } else if (typeof onUnlock === 'function') {
        onUnlock(completedPin);
      }
    } else {
      if (typeof onUnlock === 'function') {
        onUnlock(completedPin);
      }
    }
  };

  const handleKeypadVerify = async (enteredPin: string): Promise<boolean> => {
    if (typeof onUnlockWithPin === 'function') {
      return await onUnlockWithPin(enteredPin);
    }
    if (typeof onVerifyPin === 'function') {
      return await onVerifyPin(enteredPin);
    }
    return false;
  };
  return (
    <div className="relative h-screen w-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden select-none">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-[#05070d] z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:4rem_4rem] z-0 pointer-events-none" />

      {/* Floating Particles Canvas */}
      <FloatingParticles count={60} className="absolute inset-0 z-10 pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-20 w-full px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between border-b border-slate-800/60 bg-slate-950/60 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Vault Steel Emblem */}
          <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950 border border-slate-600 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_12px_rgba(0,0,0,0.5)]">
            <Shield className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-amber-200 bg-clip-text text-transparent">
                أَمَان
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800/90 border border-slate-700 text-slate-300">
                Windows Desktop • SQLite
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              خزنة رقمية مشفرة محلياً بالكامل لسطح مكتب ويندوز
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>100% Offline • Local Only</span>
          </div>
        </div>
      </header>

      {/* Main Login Content (Strictly within viewport, no overflow) */}
      <main className="relative z-20 flex-1 flex items-center justify-center p-3 sm:p-5 lg:p-6 min-h-0 overflow-hidden">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 items-center">
          
          {/* Left Hero Card (Responsive scaling to prevent vertical scroll) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden md:flex md:col-span-6 flex-col items-center md:items-start text-right"
          >
            <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700/60 shadow-[0_15px_35px_rgba(0,0,0,0.7)] group">
              <div className="relative aspect-[16/11] max-h-[38vh] w-full overflow-hidden bg-slate-900">
                <img
                  src={heroImage}
                  alt="خزنة أمان الحديدية"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                {/* Badge Over Image */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-[11px] font-semibold text-slate-200">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>الخزنة مشفرة بـ AES-256</span>
                </div>

                {/* Bottom Overlay on Image */}
                <div className="absolute bottom-2.5 inset-x-2.5 p-2.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800/80 text-right">
                  <div className="flex items-center justify-between text-xs text-slate-300 mb-0.5">
                    <span className="font-bold text-slate-100 flex items-center gap-1 text-[11px]">
                      <Cpu className="w-3 h-3 text-amber-400" />
                      تخزين محلي معزول
                    </span>
                    <span className="font-mono text-amber-400 text-[10px]">Zero-Telemetry</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    بياناتك، مفاتيح الـ API، أرقام التراخيص، وكلمات المرور مشفرة ولا تخرج من هذا الجهاز إطلاقاً.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Specs highlights */}
            <div className="mt-3 grid grid-cols-2 gap-2.5 w-full text-right">
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/70">
                <div className="text-[11px] font-bold text-slate-200 flex items-center gap-1">
                  <Monitor className="w-3 h-3 text-emerald-400" />
                  <span>تطبيق Windows حقيقي</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  قاعدة SQLite محلية ونسخ احتياطي فوري
                </div>
              </div>

              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/70">
                <div className="text-[11px] font-bold text-slate-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>تصميم معدني متوازن</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  تكيّف ديناميكي مع كامل أبعاد الشاشة
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right/Main Keypad Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="col-span-1 md:col-span-6 flex flex-col items-center justify-center"
          >
            <div className="w-full max-w-sm rounded-2xl glass-panel-elevated p-4 sm:p-5 relative border border-slate-700/60 shadow-[0_20px_45px_rgba(0,0,0,0.8)]">
              {/* Corner Screws / Vault Rivets */}
              <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-slate-600 border border-slate-800" />
              <div className="absolute top-2.5 left-2.5 w-1.5 h-1.5 rounded-full bg-slate-600 border border-slate-800" />
              <div className="absolute bottom-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-slate-600 border border-slate-800" />
              <div className="absolute bottom-2.5 left-2.5 w-1.5 h-1.5 rounded-full bg-slate-600 border border-slate-800" />

              {/* Safe Dial Icon Header */}
              <div className="text-center mb-3">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950 border-2 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)] mb-1.5">
                  {isPinSet ? (
                    <Lock className="w-5 h-5 text-amber-400" />
                  ) : (
                    <KeyRound className="w-5 h-5 text-emerald-400" />
                  )}
                </div>
                <h2 className="text-base sm:text-lg font-black text-slate-100">
                  {isPinSet ? 'فتح قفل الخزنة' : 'إعداد رمز الخزنة لأول مرة'}
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isPinSet
                    ? 'أدخل الرمز السري المكون من 6 أرقام لفك تشفير البيانات'
                    : 'قم بإنشاء رمز PIN مكون من 6 أرقام لتأمين خزنتك المحلية'}
                </p>
              </div>

              {/* The 3D Tactile Vault Keypad */}
              <VaultKeypad
                isSetupMode={!isPinSet}
                onSuccess={handleKeypadSuccess}
                onVerify={handleKeypadVerify}
              />
            </div>
          </motion.div>

        </div>
      </main>

      {/* Strict Footer with Mandatory Hallmark */}
      <footer className="relative z-20 w-full py-2.5 px-4 sm:px-6 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-right shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Monitor className="w-3.5 h-3.5 text-slate-400" />
          <span>تطبيق أمان لسطح مكتب Windows • قاعدة بيانات SQLite محلية</span>
        </div>

        {/* The Exact User Requested Hallmark */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] text-xs font-bold text-amber-300/95 tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>تصميم : عبدالله المخلافي 2026</span>
        </div>
      </footer>
    </div>
  );
};
