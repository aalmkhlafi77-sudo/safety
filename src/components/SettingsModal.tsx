import React, { useState } from 'react';
import {
  X,
  KeyRound,
  Shield,
  Download,
  Upload,
  RotateCcw,
  Volume2,
  Check,
  AlertTriangle,
  Plus,
  Trash2,
  Sparkles,
  FileSpreadsheet,
  History,
  Lock,
  Clock,
  ArrowUp,
  ArrowDown,
  Edit2,
  Database as DatabaseIcon,
  FlaskConical,
} from 'lucide-react';
import { Category, AppSettings, VaultItem, AuditLog } from '../types';
import { sounds } from '../utils/audio';
import amanLogo from '../assets/aman-logo.png';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  categories: Category[];
  onSaveCategories: (categories: Category[]) => void;
  items: VaultItem[];
  auditLogs: AuditLog[];
  onClearAuditLogs: () => void;
  onExportAman: () => void;
  onImportAman: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportExcel: () => void;
  onExportSqlite: () => void;
  onGenerate100Items: () => Promise<void>;
  onResetDatabase: (enteredPin: string) => Promise<boolean>;
  onChangePin: (oldPin: string, newPin: string) => Promise<boolean>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  categories,
  onSaveCategories,
  items,
  auditLogs,
  onClearAuditLogs,
  onExportAman,
  onImportAman,
  onExportExcel,
  onExportSqlite,
  onGenerate100Items,
  onResetDatabase,
  onChangePin,
}) => {
  if (!isOpen) return null;

  // Tabs
  const [tab, setTab] = useState<'security' | 'categories' | 'backup' | 'audit'>('security');

  // PIN Change States
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinMessage, setPinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPin, setIsChangingPin] = useState(false);

  // Category Addition & Editing
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryGlow, setNewCategoryGlow] = useState('rgba(245, 158, 11, 0.4)');
  const [categoryMessage, setCategoryMessage] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [editingCatGlow, setEditingCatGlow] = useState('rgba(245, 158, 11, 0.4)');

  // Database Reset States (with PIN verification - Requirement 12)
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetPinInput, setResetPinInput] = useState('');
  const [resetError, setResetError] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // 100 Test items generating state (Requirement 14)
  const [isGenerating, setIsGenerating] = useState(false);

  // Handle PIN Change
  const handleChangeMasterPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinMessage(null);

    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      sounds.playError();
      setPinMessage({ type: 'error', text: 'رمز المرور الجديد يجب أن يتكون من 6 أرقام بالضبط' });
      return;
    }

    if (newPin !== confirmPin) {
      sounds.playError();
      setPinMessage({ type: 'error', text: 'رمز التأكيد غير مطابق للرمز الجديد' });
      return;
    }

    setIsChangingPin(true);
    try {
      const success = await onChangePin(currentPin, newPin);
      if (success) {
        sounds.playUnlock();
        setPinMessage({ type: 'success', text: 'تم تغيير رمز الخزنة وتأمين المفتاح العشوائي بنجاح!' });
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
      } else {
        sounds.playError();
        setPinMessage({ type: 'error', text: 'رمز المرور الحالي غير صحيح' });
      }
    } catch (err) {
      sounds.playError();
      setPinMessage({ type: 'error', text: 'حدث خطأ أثناء إعادة التشفير' });
    } finally {
      setIsChangingPin(false);
    }
  };

  // Categories CRUD & Reordering (Requirement 11)
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const newCat: Category = {
      id: `cat_${Date.now()}`,
      name: newCategoryName.trim(),
      icon: 'Folder',
      color: 'from-amber-500 to-yellow-600',
      glowColor: newCategoryGlow,
      displayOrder: categories.length + 1,
    };
    onSaveCategories([...categories, newCat]);
    setNewCategoryName('');
    sounds.playKeypadClick();
    setCategoryMessage('تمت إضافة التصنيف بنجاح');
    setTimeout(() => setCategoryMessage(''), 2000);
  };

  const handleDeleteCategory = (catId: string) => {
    if (categories.length <= 1) {
      alert('لا يمكن حذف جميع التصنيفات، يجب الإبقاء على تصنيف واحد على الأقل.');
      return;
    }
    sounds.playKeypadClick();
    const updated = categories.filter((c) => c.id !== catId);
    onSaveCategories(updated.map((c, i) => ({ ...c, displayOrder: i + 1 })));
  };

  const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    sounds.playKeypadClick();
    const list = [...categories];
    const item = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = item;
    const reordered = list.map((c, idx) => ({ ...c, displayOrder: idx + 1 }));
    onSaveCategories(reordered);
  };

  const handleStartEditCategory = (cat: Category) => {
    setEditingCatId(cat.id);
    setEditingCatName(cat.name);
    setEditingCatGlow(cat.glowColor);
  };

  const handleSaveEditCategory = () => {
    if (!editingCatId || !editingCatName.trim()) return;
    sounds.playKeypadClick();
    const updated = categories.map((c) =>
      c.id === editingCatId ? { ...c, name: editingCatName.trim(), glowColor: editingCatGlow } : c
    );
    onSaveCategories(updated);
    setEditingCatId(null);
  };

  // Handle Database Reset (Requirement 12)
  const handleConfirmReset = async () => {
    setResetError('');
    if (!resetPinInput || resetPinInput.length !== 6) {
      setResetError('يرجى إدخال رمز PIN المكون من 6 أرقام');
      sounds.playError();
      return;
    }
    setIsResetting(true);
    try {
      const success = await onResetDatabase(resetPinInput);
      if (success) {
        setShowResetConfirm(false);
        setResetPinInput('');
      } else {
        setResetError('رمز PIN المدخل غير صحيح! تم إلغاء تصفير الخزنة.');
        sounds.playError();
      }
    } catch {
      setResetError('حدث خطأ أثناء تصفير قاعدة البيانات');
      sounds.playError();
    } finally {
      setIsResetting(false);
    }
  };

  const glowPresets = [
    { name: 'ذهبي عنبري', value: 'rgba(245, 158, 11, 0.4)' },
    { name: 'أزرق كوانتم', value: 'rgba(59, 130, 246, 0.4)' },
    { name: 'أخضر زمردي', value: 'rgba(16, 185, 129, 0.4)' },
    { name: 'بنفسجي ملكي', value: 'rgba(168, 85, 247, 0.4)' },
    { name: 'وردي روبي', value: 'rgba(244, 63, 94, 0.4)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-hidden">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl glass-panel-elevated p-4 sm:p-6 border border-slate-700/80 shadow-[0_25px_60px_rgba(0,0,0,0.85)] text-right animate-in fade-in zoom-in-95 duration-200">
        
        {/* Decorative Rivets */}
        <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-slate-600" />
        <div className="absolute top-3 left-3 w-1.5 h-1.5 rounded-full bg-slate-600" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-700/80 p-0.5 overflow-hidden shrink-0 shadow-md">
              <img
                src={amanLogo}
                alt="شعار أمان Safety"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-100 flex items-center gap-2">
                <span>لوحة التحكم وإعدادات أمان</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-700/40 text-blue-300 font-mono">
                  Safety
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                تخصيص الأمان، القفل التلقائي، إدارة التصنيفات، وقاعدة بيانات SQLite
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 mt-3 p-1 rounded-xl bg-slate-900/90 border border-slate-800 shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setTab('security')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              tab === 'security'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>الأمان والقفل</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('categories')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              tab === 'categories'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>إدارة التصنيفات ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('backup')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              tab === 'backup'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DatabaseIcon className="w-3.5 h-3.5" />
            <span>قاعدة البيانات والنسخ الاحتياطي</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('audit')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              tab === 'audit'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>سجل العمليات ({auditLogs.length})</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-4 text-slate-200 text-xs">
          
          {/* TAB 1: SECURITY & TIMERS */}
          {tab === 'security' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              
              {/* Change PIN Box */}
              <form onSubmit={handleChangeMasterPin} className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4" />
                    <span>تغيير رمز المرور الرئيسي (Master PIN)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                    مفتاح 256-bit عشوائي محمي
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">الرمز الحالي (6 أرقام):</label>
                    <input
                      type="password"
                      maxLength={6}
                      value={currentPin}
                      onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-center font-mono text-sm tracking-widest text-slate-100 focus:outline-none focus:border-amber-400"
                      placeholder="••••••"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">الرمز الجديد:</label>
                    <input
                      type="password"
                      maxLength={6}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-center font-mono text-sm tracking-widest text-slate-100 focus:outline-none focus:border-amber-400"
                      placeholder="••••••"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">تأكيد الرمز الجديد:</label>
                    <input
                      type="password"
                      maxLength={6}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-center font-mono text-sm tracking-widest text-slate-100 focus:outline-none focus:border-amber-400"
                      placeholder="••••••"
                      required
                    />
                  </div>
                </div>

                {pinMessage && (
                  <div
                    className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                      pinMessage.type === 'success'
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950/60 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {pinMessage.type === 'success' ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    <span>{pinMessage.text}</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isChangingPin || !currentPin || !newPin || !confirmPin}
                    className="gold-btn-3d py-1.5 px-4 rounded-xl text-xs font-bold text-slate-950 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isChangingPin ? 'جاري التحديث...' : 'تحديث رمز PIN'}</span>
                  </button>
                </div>
              </form>

              {/* Timers & System Controls */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>مؤقتات الخمول ومسح الحافظة التلقائي</span>
                </div>

                {/* Auto Lock Selection */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <div>
                    <div className="text-xs font-bold text-slate-200">القفل التلقائي عند الخمول</div>
                    <div className="text-[10px] text-slate-400">تأمين الخزنة تلقائياً عند غياب نشاط المستخدم</div>
                  </div>
                  <select
                    value={settings.autoLockMinutes}
                    onChange={(e) =>
                      onSaveSettings({
                        ...settings,
                        autoLockMinutes: Number(e.target.value),
                      })
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value={1}>بعد دقيقة واحدة</option>
                    <option value={5}>بعد 5 دقائق</option>
                    <option value={10}>بعد 10 دقائق (مستحسن)</option>
                    <option value={30}>بعد 30 دقيقة</option>
                    <option value={0}>تعطيل القفل التلقائي</option>
                  </select>
                </div>

                {/* Clipboard Clear Timeout */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <div>
                    <div className="text-xs font-bold text-slate-200">مسح الحافظة التلقائي (Clipboard)</div>
                    <div className="text-[10px] text-slate-400">تفريغ ذاكرة النسخ بعد نسخ كلمات المرور لحمايتها</div>
                  </div>
                  <select
                    value={settings.clipboardTimeoutSeconds}
                    onChange={(e) =>
                      onSaveSettings({
                        ...settings,
                        clipboardTimeoutSeconds: Number(e.target.value),
                      })
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value={15}>بعد 15 ثانية</option>
                    <option value={30}>بعد 30 ثانية (مستحسن)</option>
                    <option value={60}>بعد 60 ثانية</option>
                    <option value={0}>تعطيل المسح التلقائي</option>
                  </select>
                </div>

                {/* Sound effects */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-xs font-bold text-slate-200">الأصوات الميكانيكية</div>
                      <div className="text-[10px] text-slate-400">نقرات الأزرار ثلاثية الأبعاد وفتح الخزنة</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.enabled = !settings.soundEffects;
                      onSaveSettings({ ...settings, soundEffects: !settings.soundEffects });
                    }}
                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                      settings.soundEffects ? 'bg-amber-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        settings.soundEffects ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CATEGORIES MANAGEMENT (Requirement 11) */}
          {tab === 'categories' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Add New Category */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-100">إضافة تصنيف جديد مع إضاءة محيطية</div>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="اسم التصنيف (مثال: مستودعات، سيرفرات)..."
                    className="flex-1 w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <select
                      value={newCategoryGlow}
                      onChange={(e) => setNewCategoryGlow(e.target.value)}
                      className="px-2 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                    >
                      {glowPresets.map((g) => (
                        <option key={g.name} value={g.value}>{g.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="gold-btn-3d px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-950 flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة</span>
                    </button>
                  </div>
                </div>
                {categoryMessage && (
                  <div className="text-xs text-emerald-400 font-semibold">{categoryMessage}</div>
                )}
              </div>

              {/* Edit Category Modal / Form if active */}
              {editingCatId && (
                <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/40 space-y-2 animate-in fade-in">
                  <div className="text-xs font-bold text-amber-300">تعديل بيانات التصنيف المحدد</div>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="text"
                      value={editingCatName}
                      onChange={(e) => setEditingCatName(e.target.value)}
                      className="flex-1 w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-amber-400 text-xs text-slate-100 focus:outline-none"
                    />
                    <select
                      value={editingCatGlow}
                      onChange={(e) => setEditingCatGlow(e.target.value)}
                      className="px-2 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200"
                    >
                      {glowPresets.map((g) => (
                        <option key={g.name} value={g.value}>{g.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleSaveEditCategory}
                      className="gold-btn-3d px-3 py-1.5 rounded-xl text-xs font-bold text-slate-950 cursor-pointer"
                    >
                      حفظ التعديل
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCatId(null)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}

              {/* Categories List with Reorder, Edit, Delete */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400 px-1">
                  المصنفات الحالية (استخدم الأسهم لإعادة الترتيب):
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {categories.map((cat, index) => (
                    <div
                      key={cat.id}
                      style={{
                        boxShadow: `0 2px 10px ${cat.glowColor || 'rgba(245, 158, 11, 0.2)'}`,
                      }}
                      className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono text-slate-500 w-4 text-center">
                          {index + 1}
                        </span>
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.glowColor || '#fbbf24' }}
                        />
                        <span className="text-xs font-bold text-slate-200 truncate">{cat.name}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Move Up */}
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveCategory(index, 'up')}
                          className="p-1 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition disabled:opacity-30 cursor-pointer"
                          title="نقل لأعلى"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        {/* Move Down */}
                        <button
                          type="button"
                          disabled={index === categories.length - 1}
                          onClick={() => handleMoveCategory(index, 'down')}
                          className="p-1 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition disabled:opacity-30 cursor-pointer"
                          title="نقل لأسفل"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => handleStartEditCategory(cat)}
                          className="p-1 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition cursor-pointer"
                          title="تعديل اسم التصنيف"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                          title="حذف التصنيف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BACKUP, SQLITE & EXPORT (Requirements 8, 10, 12, 14) */}
          {tab === 'backup' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              
              {/* Primary Encrypted .aman Backup (Requirement 8) */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  <span>النسخ الاحتياطي المشفر (.aman) — الحماية الأساسية والوحيدة للنسخ</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  يتم تشفير كافة السجلات والتصنيفات بحاوية مشفرة بـ AES-256-GCM. يمنع تصدير أي ملفات JSON صريحة غير مشفرة لضمان الأمان المطلق.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onExportAman}
                    className="gold-btn-3d py-2 px-3 rounded-xl text-xs font-bold text-slate-950 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تصدير ملف مشفر (.aman)</span>
                  </button>

                  <label className="vault-btn-3d py-2 px-3 rounded-xl text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>استيراد واستعادة ملف (.aman)</span>
                    <input
                      type="file"
                      accept=".aman"
                      onChange={onImportAman}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Raw SQLite Database Binary (.sqlite) */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                  <DatabaseIcon className="w-4 h-4" />
                  <span>قاعدة بيانات SQLite الحقيقية (aman_vault.sqlite)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  جميع السجلات تحفظ داخل محرك SQLite متكامل (جداول relational مشفرة). يمكنك تصدير الملف الثنائي للتدقيق الأمني.
                </p>
                <button
                  type="button"
                  onClick={onExportSqlite}
                  className="w-full py-2 px-3 rounded-xl bg-blue-950/40 hover:bg-blue-900/40 border border-blue-800/60 text-blue-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير ملف SQLite الثنائي (.sqlite)</span>
                </button>
              </div>

              {/* Excel Export (Requirement 10) */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>تقرير إكسل المبوب (.xlsx)</span>
                </div>
                <p className="text-[11px] text-amber-300/90 bg-amber-950/30 p-2 rounded-lg border border-amber-900/40">
                  <strong>تنبيه:</strong> يرتب ملف الإكسل السجلات بحسب التصنيف، وكل حقل في عمود منفصل، ويُستخدم للأرشفة المكتبية والطباعة.
                </p>
                <button
                  type="button"
                  onClick={onExportExcel}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>تصدير إلى مصنف Excel (.xlsx)</span>
                </button>
              </div>

              {/* Generate 100 Test Items (Requirement 14) */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4" />
                  <span>أداة اختبار الأداء وأوضاع العرض (100 سجل)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  توليد 100 سجل تجريبي مشفر عبر محرك SQLite لاختبار أوضاع العرض الثلاثية وسرعة التمرير والتصفية.
                </p>
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={async () => {
                    setIsGenerating(true);
                    await onGenerate100Items();
                    setIsGenerating(false);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/40 border border-purple-800/60 text-purple-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isGenerating ? 'جاري توليد وتشفير 100 سجل...' : 'توليد 100 سجل تجريبي للاختبار'}</span>
                </button>
              </div>

              {/* Danger Zone: Reset Database with PIN Confirmation (Requirement 12) */}
              <div className="p-3.5 rounded-2xl bg-rose-950/25 border border-rose-900/50 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>منطقة الخطر - تصفير قاعدة بيانات SQLite</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  سيؤدي هذا الإجراء إلى حذف كافة السجلات والتصنيفات من قاعدة بيانات SQLite المحلية نهائياً وإعادة ضبط الخزنة للحالة الافتراضية.
                </p>

                {!showResetConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-900/60 hover:bg-rose-800 text-xs font-bold text-rose-200 transition cursor-pointer"
                  >
                    بدء إجراءات مسح وتصفير الخزنة
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-950 border border-rose-800/80 space-y-2 animate-in fade-in">
                    <div className="text-xs font-bold text-rose-300">
                      تأكيد الأمان: يرجى إدخال رمز PIN الخاص بك لتنفيذ التصفير:
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        maxLength={6}
                        value={resetPinInput}
                        onChange={(e) => setResetPinInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        className="w-36 px-3 py-1.5 rounded-lg bg-slate-900 border border-rose-700 text-center font-mono text-sm tracking-widest text-rose-200 focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={isResetting || resetPinInput.length !== 6}
                        onClick={handleConfirmReset}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-slate-950 text-xs font-bold cursor-pointer disabled:opacity-50"
                      >
                        {isResetting ? 'جاري التحقق...' : 'تأكيد المسح النهائي'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowResetConfirm(false);
                          setResetPinInput('');
                          setResetError('');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                    {resetError && (
                      <div className="text-xs text-rose-400 font-semibold">{resetError}</div>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: AUDIT LOGS */}
          {tab === 'audit' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-300">
                  سجل الأحداث والعمليات في SQLite ({auditLogs.length})
                </span>
                {auditLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearAuditLogs}
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>مسح السجل</span>
                  </button>
                )}
              </div>

              {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                  لا توجد عمليات مسجلة حتى الآن.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[45vh] overflow-y-auto pr-1">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            log.action.includes('فشل') || log.action.includes('تصفير')
                              ? 'bg-rose-400'
                              : log.action.includes('تعديل') || log.action.includes('تغيير')
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                        />
                        <div className="truncate">
                          <span className="font-bold text-slate-200">{log.action}: </span>
                          <span className="text-slate-400">{log.details || log.itemTitle}</span>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 whitespace-nowrap mr-2">
                        {new Date(log.timestamp).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer with Mandatory Hallmark (Requirement 16) */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>تصميم : عبدالله المخلافي 2026</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
