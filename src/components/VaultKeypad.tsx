import React, { useEffect, useState } from 'react';
import { Delete, ShieldAlert, KeyRound, RotateCcw, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sounds } from '../utils/audio';

interface VaultKeypadProps {
  isSetupMode: boolean;
  onSuccess: (pin: string) => void;
  onVerify: (pin: string) => Promise<boolean>;
}

export const VaultKeypad: React.FC<VaultKeypadProps> = ({ isSetupMode, onSuccess, onVerify }) => {
  const [pin, setPin] = useState<string>('');
  const [setupFirstPin, setSetupFirstPin] = useState<string>('');
  const [setupStep, setSetupStep] = useState<'create' | 'confirm'>('create');
  const [isError, setIsError] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleDigit = (digit: string) => {
    if (pin.length >= 6 || isSuccess) return;
    sounds.playKeypadClick();
    const nextPin = pin + digit;
    setPin(nextPin);
    setIsError(false);
    setErrorMessage('');

    if (nextPin.length === 6) {
      handlePinComplete(nextPin);
    }
  };

  const handleDelete = () => {
    if (pin.length === 0 || isSuccess) return;
    sounds.playKeypadClick();
    setPin(pin.slice(0, -1));
    setIsError(false);
    setErrorMessage('');
  };

  const handleClear = () => {
    if (isSuccess) return;
    sounds.playKeypadClick();
    setPin('');
    setIsError(false);
    setErrorMessage('');
  };

  const handlePinComplete = async (completedPin: string) => {
    if (isSetupMode) {
      if (setupStep === 'create') {
        setSetupFirstPin(completedPin);
        setPin('');
        setSetupStep('confirm');
        sounds.playKeypadClick();
      } else {
        // Confirm step
        if (completedPin === setupFirstPin) {
          setIsSuccess(true);
          sounds.playUnlock();
          setTimeout(() => {
            if (typeof onSuccess === 'function') {
              onSuccess(completedPin);
            }
          }, 500);
        } else {
          setIsError(true);
          sounds.playError();
          setErrorMessage('الرمزان غير متطابقين، أعد المحاولة من البداية');
          setTimeout(() => {
            setPin('');
            setSetupFirstPin('');
            setSetupStep('create');
            setIsError(false);
          }, 1200);
        }
      }
    } else {
      // Normal Unlock verification
      const valid = typeof onVerify === 'function' ? await onVerify(completedPin) : false;
      if (valid) {
        setIsSuccess(true);
        sounds.playUnlock();
        setTimeout(() => {
          if (typeof onSuccess === 'function') {
            onSuccess(completedPin);
          }
        }, 500);
      } else {
        setIsError(true);
        sounds.playError();
        setErrorMessage('رمز المرور غير صحيح، يرجى المحاولة مرة أخرى');
        setTimeout(() => {
          setPin('');
          setIsError(false);
        }, 900);
      }
    }
  };

  // Hardware keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, setupStep, setupFirstPin, isSetupMode, isSuccess]);

  // Digits array strictly 1-9
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center">
      {/* Vault Pin Indicator Panel */}
      <div className="w-full p-3 sm:p-4 mb-3 sm:mb-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-700/60 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] backdrop-blur-md">
        <div className="flex items-center justify-between mb-2 px-1 text-xs font-semibold text-slate-400">
          <span className="flex items-center gap-1.5 text-amber-400 font-bold">
            <KeyRound className="w-3.5 h-3.5" />
            {isSetupMode
              ? setupStep === 'create'
                ? 'أنشئ رمز الخزنة الجديد (6 أرقام)'
                : 'تأكيد رمز الخزنة (أعد كتابته)'
              : 'أدخل رمز الخزنة (6 أرقام)'}
          </span>
          <span className="font-mono text-slate-300 text-xs">{pin.length} / 6</span>
        </div>

        {/* 6 Metallic LED Indicators */}
        <motion.div
          animate={isError ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
          transition={{ duration: 0.35 }}
          className="flex justify-center items-center gap-2.5 sm:gap-3 py-1 sm:py-2"
        >
          {Array.from({ length: 6 }).map((_, index) => {
            const isFilled = index < pin.length;
            return (
              <div
                key={index}
                className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-950 border border-slate-700/80 shadow-[inset_0_3px_6px_rgba(0,0,0,0.9)]"
              >
                <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-slate-800" />
                <div className="absolute bottom-1 left-1 w-1 h-1 rounded-full bg-slate-800" />

                {isFilled ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`w-3.5 h-3.5 rounded-full ${
                      isError
                        ? 'bg-rose-500 shadow-[0_0_12px_#f43f5e]'
                        : isSuccess
                        ? 'bg-emerald-400 shadow-[0_0_14px_#34d399]'
                        : 'bg-amber-400 shadow-[0_0_12px_#fbbf24]'
                    }`}
                  />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                )}
              </div>
            );
          })}
        </motion.div>

        {/* Status / Error Message */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-1.5 text-center text-xs font-semibold text-rose-400 flex items-center justify-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3D Tactile Safe Numeric Keypad: STRICTLY LEFT-TO-RIGHT via dir="ltr" */}
      <div dir="ltr" className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full">
        {digits.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handleDigit(num)}
            className="vault-btn-3d h-11 sm:h-13 rounded-xl flex flex-col items-center justify-center text-lg sm:text-xl font-bold font-mono text-slate-100 select-none cursor-pointer focus:outline-none"
          >
            <span>{num}</span>
            <span className="text-[8px] sm:text-[9px] font-sans font-medium text-slate-400 uppercase tracking-widest -mt-0.5">
              {num === '1'
                ? 'SEC'
                : num === '2'
                ? 'ABC'
                : num === '3'
                ? 'DEF'
                : num === '4'
                ? 'GHI'
                : num === '5'
                ? 'JKL'
                : num === '6'
                ? 'MNO'
                : num === '7'
                ? 'PQRS'
                : num === '8'
                ? 'TUV'
                : 'WXYZ'}
            </span>
          </button>
        ))}

        {/* Clear Button */}
        <button
          type="button"
          onClick={handleClear}
          title="مسح الكل"
          className="vault-btn-3d h-11 sm:h-13 rounded-xl flex flex-col items-center justify-center text-[11px] font-bold text-slate-300 select-none cursor-pointer focus:outline-none hover:text-amber-400"
        >
          <RotateCcw className="w-4 h-4 mb-0.5" />
          <span>مسح</span>
        </button>

        {/* Zero: STRICTLY CENTER ROW 4 */}
        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="vault-btn-3d h-11 sm:h-13 rounded-xl flex flex-col items-center justify-center text-lg sm:text-xl font-bold font-mono text-slate-100 select-none cursor-pointer focus:outline-none"
        >
          <span>0</span>
          <span className="text-[8px] sm:text-[9px] font-sans font-medium text-slate-400 tracking-widest -mt-0.5">
            LOCK
          </span>
        </button>

        {/* Backspace Button */}
        <button
          type="button"
          onClick={handleDelete}
          title="تراجع"
          className="vault-btn-3d h-11 sm:h-13 rounded-xl flex flex-col items-center justify-center text-[11px] font-bold text-slate-300 select-none cursor-pointer focus:outline-none hover:text-rose-400"
        >
          <Delete className="w-4 h-4 mb-0.5" />
          <span>تراجع</span>
        </button>
      </div>

      {/* Hardware Keyboard Hint */}
      <div className="mt-2.5 sm:mt-3 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
        <kbd className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-300 font-mono text-[10px]">
          Numpad 0 - 9
        </kbd>
        <span>يدعم لوحة المفاتيح الميكانيكية للكمبيوتر مباشرة</span>
      </div>
    </div>
  );
};
