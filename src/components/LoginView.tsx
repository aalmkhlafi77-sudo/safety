import React from 'react';
import { Lock, Sparkles, Monitor, Cpu, KeyRound } from 'lucide-react';
import { motion } from 'motion/react';
import { VaultKeypad } from './VaultKeypad';
import { FloatingParticles } from './FloatingParticles';
import amanLogo from '../assets/aman-logo.png';

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
          {/* Official AMAN Logo Emblem */}
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 shadow-[0_4px_12px_rgba(0,0,0,0.6)] overflow-hidden shrink-0 group">
            <img
              src={amanLogo}
              alt="شعار أمان"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain p-0.5"
            />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-amber-200 bg-clip-text text-transparent">
                أَمَان
              </h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-700/40 text-blue-300 font-mono">
                Safety
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800/90 border border-slate-700 text-slate-300 hidden sm:inline-block">
                Windows Desktop • SQLite
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              خزانة الرموز وكلمات المرور • خدمات حماية موثوقة ومحلية بالكامل
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
          
          {/* Left Hero Card - Prominent Clear Logo Display */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden md:flex md:col-span-6 flex-col items-center md:items-start text-right"
          >
            <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700/80 shadow-[0_15px_35px_rgba(0,0,0,0.7)] group bg-slate-900/90">
              {/* Logo Presentation Container with object-contain to prevent any distortion */}
              <div className="relative aspect-[16/11] max-h-[38vh] w-full flex items-center justify-center p-3 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
                <img
                  src={amanLogo}
                  alt="شعار أمان Safety - خزانة الرموز وكلمات المرور"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.8)] transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent pointer-events-none" />

                {/* Badge Over Image */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-[11px] font-semibold text-slate-200 shadow-md">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>تشفير عسكري AES-256</span>
                </div>

                {/* Bottom Overlay on Image */}
                <div className="absolute bottom-2.5 inset-x-2.5 p-2.5 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-800/90 text-right">
                  <div className="flex items-center justify-between text-xs text-slate-300 mb-0.5">
                    <span className="font-bold text-slate-100 flex items-center gap-1.5 text-[11px]">
                      <Cpu className="w-3.5 h-3.5 text-amber-400" />
                      خزانة الرموز وكلمات المرور
                    </span>
                    <span className="font-mono text-emerald-400 font-bold text-[10px]">حماية موثوقة</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    بياناتك، مفاتيح الـ API، أرقام التراخيص، وكلمات المرور مشفرة ومحفوظة محلياً دون اتصال خارجي.
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

              {/* Safe Dial / Brand Emblem Header */}
              <div className="text-center mb-3">
                <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 border-2 border-slate-700/80 shadow-[0_4px_16px_rgba(0,0,0,0.6)] overflow-hidden mb-1.5 group">
                  <img
                    src={amanLogo}
                    alt="أمان Safety"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain p-1"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 p-1 rounded-full bg-slate-950 border border-slate-700 shadow">
                    {isPinSet ? (
                      <Lock className="w-3 h-3 text-amber-400" />
                    ) : (
                      <KeyRound className="w-3 h-3 text-emerald-400" />
                    )}
                  </div>
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
