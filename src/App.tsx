import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Search,
  Plus,
  Star,
  Globe,
  Key,
  Award,
  Database,
  Sparkles,
  Layers,
  FolderOpen,
  ArrowUpDown,
  Lock,
  LayoutGrid,
  List,
  AlignJustify,
  ChevronsDown,
  ChevronsUp,
  History,
  ShieldCheck,
  Mic,
  MicOff,
} from 'lucide-react';
import { VaultItem, Category, AppSettings, AuditLog } from './types';
import { matchesSearchQuery, safeLocaleCompareTitle, safeString } from './utils/searchSafety';
import { db } from './utils/database';
import { exportVaultToExcel } from './utils/excelExport';
import { exportSqliteDatabaseFile } from './utils/storage';
import { sounds } from './utils/audio';
import { LoginView } from './components/LoginView';
import { Navbar } from './components/Navbar';
import { ItemCard } from './components/ItemCard';
import { ItemCompactCard } from './components/ItemCompactCard';
import { ItemListView } from './components/ItemListView';
import amanLogo from './assets/aman-logo.png';
import { ItemDetailModal } from './components/ItemDetailModal';
import { ItemFormModal } from './components/ItemFormModal';
import { SettingsModal } from './components/SettingsModal';
import { FeatureErrorBoundary } from './components/FeatureErrorBoundary';

export default function App() {
  // Authentication & Master PIN state
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [isPinSet, setIsPinSet] = useState<boolean>(false);
  const [isDbReady, setIsDbReady] = useState<boolean>(false);

  // App Data
  const [items, setItems] = useState<VaultItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');

  // View Mode: 'cards' | 'compact' | 'list'
  const [viewMode, setViewMode] = useState<'cards' | 'compact' | 'list'>('cards');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleItemExpansion = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAllItems = (expand: boolean) => {
    const newState: Record<string, boolean> = {};
    (items || []).forEach((it) => {
      if (it && it.id) {
        newState[it.id] = expand;
      }
    });
    setExpandedItems(newState);
  };

  // Modals
  const [viewItem, setViewItem] = useState<VaultItem | null>(null);
  const [formItem, setFormItem] = useState<VaultItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-Lock Inactivity Tracking
  const lastActivityRef = useRef<number>(Date.now());

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2500);
  }, []);

  // Speech Recognition for Voice Search
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  const toggleVoiceSearch = useCallback(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      showToast('البحث الصوتي ميزة اختيارية وغير مدعومة في البيئة الحالية — استخدم البحث النصي كالمعتاد');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      showToast('تم إيقاف الاستماع الصوتي');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'ar-SA';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        sounds.playKeypadClick();
        showToast('🎙️ جاري الاستماع... تحدث بالكلمة التي تبحث عنها');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        const cleanText = transcript.trim();
        if (cleanText) {
          setSearchQuery(cleanText);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          showToast('تم رفض صلاحية الميكروفون — يستمر البحث النصي المعتاد دون مشكلة');
        } else if (event.error === 'no-speech') {
          showToast('لم يتم التقاط صوت، يرجى التحدث بوضوح والمحاولة ثانية');
        } else {
          showToast('تعذر التعرف على الصوت، يرجى المحاولة لاحقاً');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition error:', err);
      setIsListening(false);
      showToast('تعذر تشغيل الميكروفون للبحث الصوتي');
    }
  }, [isListening, showToast]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  // Initialize DB and load settings
  const reloadData = useCallback(async () => {
    try {
      const currentSettings = await db.getSettings();
      const currentCategories = await db.getCategories();
      const currentLogs = await db.getAuditLogs();

      setSettings(currentSettings);
      setIsPinSet(currentSettings.isPinSet);
      setCategories(currentCategories);
      setAuditLogs(currentLogs);
      setViewMode(currentSettings.defaultViewMode || 'cards');
      sounds.enabled = currentSettings.soundEffects;

      if (db.getActiveKey()) {
        const loadedItems = await db.getItems();
        setItems(loadedItems);
      }
    } catch (err) {
      console.error('Failed to reload data:', err);
    } finally {
      setIsDbReady(true);
    }
  }, []);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  // Handle Master PIN setup on first launch
  const handleSetupPin = async (pin: string) => {
    try {
      const updated = await db.updatePin(pin);
      setSettings(updated);
      setIsPinSet(true);
      setIsUnlocked(true);
      const loadedItems = await db.getItems();
      setItems(loadedItems);
      sounds.playUnlock();
      showToast('تم ضبط رمز المرور الرئيسي وتأمين الخزنة بنجاح');
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#fbbf24', '#f59e0b', '#38bdf8', '#10b981'],
      });
      reloadData();
    } catch (err) {
      sounds.playError();
      showToast('حدث خطأ أثناء إعداد الرمز السري');
    }
  };

  // Handle Unlock with PIN
  const handleUnlockWithPin = async (pin: string): Promise<boolean> => {
    try {
      const isValid = await db.verifyPin(pin);
      if (isValid) {
        setIsUnlocked(true);
        sounds.playUnlock();
        const loadedItems = await db.getItems();
        setItems(loadedItems);
        await db.addAuditLog('تسجيل دخول ناجح', 'تم فتح الخزنة بواسطة رمز المرور الصحيح');
        reloadData();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#fbbf24', '#f59e0b', '#38bdf8', '#ffffff'],
        });
        lastActivityRef.current = Date.now();
        return true;
      } else {
        sounds.playError();
        await db.addAuditLog('فشل دخول', 'محاولة إدخال رمز مرور غير صحيح');
        reloadData();
        return false;
      }
    } catch (err) {
      console.error('Unlock error:', err);
      return false;
    }
  };

  // Handle Vault Manual or Inactivity Lock
  const handleLock = useCallback(
    (reason?: string) => {
      setIsUnlocked(false);
      db.setActiveKey(null);
      sounds.playLock();
      if (reason) {
        showToast(reason);
      }
    },
    [showToast]
  );

  // Inactivity / Auto-Lock Timer listener
  useEffect(() => {
    if (!isUnlocked || !settings) return;
    const lockMins = Number(settings.autoLockMinutes);
    if (isNaN(lockMins) || lockMins <= 0) return;

    lastActivityRef.current = Date.now();

    const resetActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener('mousemove', resetActivity, { passive: true });
    window.addEventListener('keydown', resetActivity, { passive: true });
    window.addEventListener('click', resetActivity, { passive: true });
    window.addEventListener('scroll', resetActivity, { passive: true });

    const checkInterval = setInterval(() => {
      const idleTimeMs = Date.now() - lastActivityRef.current;
      const thresholdMs = lockMins * 60 * 1000;
      if (idleTimeMs >= thresholdMs) {
        handleLock('انتهت مهلة النشاط وتم قفل وتأمين الخزنة تلقائياً');
      }
    }, 10000);

    return () => {
      window.removeEventListener('mousemove', resetActivity);
      window.removeEventListener('keydown', resetActivity);
      window.removeEventListener('click', resetActivity);
      window.removeEventListener('scroll', resetActivity);
      clearInterval(checkInterval);
    };
  }, [isUnlocked, settings?.autoLockMinutes, handleLock]);

  // Save Settings
  const handleSaveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await db.saveSettings(newSettings);
    sounds.enabled = newSettings.soundEffects;
    showToast('تم حفظ الإعدادات بنجاح');
    reloadData();
  };

  // Change Master PIN
  const handleChangePin = async (oldPin: string, newPin: string): Promise<boolean> => {
    try {
      const success = await db.changeMasterPin(oldPin, newPin);
      if (success) {
        reloadData();
        showToast('تم تغيير رمز المرور وإعادة تشفير البيانات بنجاح');
      }
      return success;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Save Categories
  const handleSaveCategories = async (newCategories: Category[]) => {
    setCategories(newCategories);
    await db.saveCategories(newCategories);
    showToast('تم تحديث قائمة المصنفات');
    reloadData();
  };

  // Save or Update Vault Item
  const handleSaveItem = async (savedItem: VaultItem) => {
    const exists = items.some((it) => it.id === savedItem.id);
    let updatedItems: VaultItem[];
    if (exists) {
      updatedItems = items.map((it) => (it.id === savedItem.id ? savedItem : it));
      await db.addAuditLog('تعديل عنصر', savedItem.title, 'تم تحديث بيانات السجل');
      showToast('تم تحديث بيانات العنصر');
    } else {
      updatedItems = [savedItem, ...items];
      await db.addAuditLog('إنشاء عنصر', savedItem.title, 'تم حفظ سجل جديد في الخزنة');
      showToast('تمت إضافة العنصر إلى الخزنة بنجاح');
    }

    setItems(updatedItems);
    await db.saveItems(updatedItems);
    setIsFormOpen(false);
    setFormItem(null);
    if (viewItem?.id === savedItem.id) {
      setViewItem(savedItem);
    }
    reloadData();
  };

  // Delete Vault Item
  const handleDeleteItem = async (id: string) => {
    const safeItems = Array.isArray(items) ? items : [];
    const itemToDelete = safeItems.find((it) => it && it.id === id);
    if (!window.confirm(`هل أنت متأكد من حذف "${itemToDelete?.title || 'هذا العنصر'}" من الخزنة نهائياً؟`)) {
      return;
    }
    sounds.playKeypadClick();
    const updated = safeItems.filter((it) => it && it.id !== id);
    setItems(updated);
    await db.saveItems(updated);
    if (itemToDelete) {
      await db.addAuditLog('حذف عنصر', itemToDelete.title, 'تم حذف السجل من قاعدة البيانات');
    }
    if (viewItem?.id === id) {
      setViewItem(null);
    }
    showToast('تم حذف العنصر من الخزنة');
    reloadData();
  };

  // Duplicate Item
  const handleDuplicateItem = async (itemToDup: VaultItem) => {
    sounds.playKeypadClick();
    const safeItems = Array.isArray(items) ? items : [];
    const duplicated: VaultItem = {
      ...itemToDup,
      id: Date.now().toString(),
      title: `${itemToDup.title} (نسخة مكررة)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [duplicated, ...safeItems];
    setItems(updated);
    await db.saveItems(updated);
    await db.addAuditLog('تكرار عنصر', duplicated.title, 'تم إنشاء نسخة مكررة من السجل');
    showToast('تم تكرار العنصر بنجاح');
    reloadData();
  };

  // Toggle Favorite
  const handleToggleFavorite = async (id: string) => {
    sounds.playKeypadClick();
    const safeItems = Array.isArray(items) ? items : [];
    const updated = safeItems.map((it) => (it && it.id === id ? { ...it, isFavorite: !it.isFavorite } : it));
    setItems(updated);
    await db.saveItems(updated);
  };

  // Export Encrypted .aman
  const handleExportAman = async () => {
    try {
      sounds.playUnlock();
      const content = await db.exportAmanBackup();
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aman-vault-encrypted-${new Date().toISOString().slice(0, 10)}.aman`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('تم تصدير ملف النسخة الاحتياطية المشفر (.aman)');
      reloadData();
    } catch (err: any) {
      alert(err.message || 'فشل التصدير المشفر');
    }
  };

  // Import Encrypted .aman
  const handleImportAman = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const res = await db.importAmanBackup(text);
        sounds.playUnlock();
        showToast(`تم استيراد ${res.itemsCount} عنصر مشفر بنجاح`);
        setIsSettingsOpen(false);
        reloadData();
      } catch (err: any) {
        alert(err.message || 'فشل استيراد الملف المشفر. تأكد أن الرمز السري الحالي يطابق الملف.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Export Excel (.xlsx)
  const handleExportExcel = () => {
    sounds.playKeypadClick();
    exportVaultToExcel(items, categories);
    db.addAuditLog('تصدير Excel', `تم تصدير تقرير إكسل لـ ${items.length} عنصر`);
    showToast('جاري تحميل مصنف Excel (.xlsx)');
    reloadData();
  };

  // Export Raw SQLite Database Binary (.sqlite)
  const handleExportSqlite = async () => {
    try {
      sounds.playUnlock();
      await exportSqliteDatabaseFile();
      await db.addAuditLog('تصدير SQLite', 'تم تصدير ملف قاعدة بيانات SQLite الثنائي (.sqlite)');
      showToast('تم تصدير ملف قاعدة بيانات SQLite بنجاح');
      reloadData();
    } catch (err: any) {
      alert(err.message || 'فشل تصدير ملف SQLite');
    }
  };

  // Generate 100 Test Items for Performance & View Verification (Requirement 14)
  const handleGenerate100Items = async () => {
    try {
      sounds.playUnlock();
      const count = await db.generate100TestItems();
      showToast(`تم توليد ${count} سجل تجريبي مشفر داخل قاعدة بيانات SQLite`);
      reloadData();
    } catch (err: any) {
      alert(err.message || 'فشل توليد السجلات التجريبية');
    }
  };

  // Reset Database (Requirement 12 - with strict PIN verification)
  const handleResetDatabase = async (enteredPin: string): Promise<boolean> => {
    sounds.playKeypadClick();
    const success = await db.resetDatabase(enteredPin);
    if (success) {
      sounds.playUnlock();
      showToast('تمت إعادة ضبط وتصفير قاعدة بيانات SQLite للحالة الافتراضية');
      setIsSettingsOpen(false);
      reloadData();
      return true;
    } else {
      sounds.playError();
      return false;
    }
  };

  // Clear Audit Logs
  const handleClearAuditLogs = async () => {
    await db.clearAuditLogs();
    setAuditLogs([]);
    showToast('تم مسح سجل العمليات');
  };

  // Filter and Sort Items (Crash-Proof Search & MultiEntry Filter)
  const filteredItems = useMemo(() => {
    return (items || [])
      .filter((it) => {
        if (!it) return false;

        // Search query filter with complete null-safety
        const cleanQuery = safeString(searchQuery).trim();
        if (cleanQuery) {
          if (!matchesSearchQuery(it, cleanQuery)) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== 'all' && it.category !== selectedCategory) {
          return false;
        }

        // Favorites filter
        if (onlyFavorites && !it.isFavorite) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (!a || !b) return 0;
        if (sortBy === 'newest') {
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          return dateB - dateA;
        }
        if (sortBy === 'oldest') {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB;
        }
        if (sortBy === 'title') {
          return safeLocaleCompareTitle(a, b);
        }
        return 0;
      });
  }, [items, searchQuery, selectedCategory, onlyFavorites, sortBy]);

  // Quick statistics
  const stats = useMemo(() => {
    const total = items.length;
    const withApis = items.filter((it) => it.apiKeys && it.apiKeys.length > 0).length;
    const withLicenses = items.filter((it) => it.licenseKeys && it.licenseKeys.length > 0).length;
    const favorites = items.filter((it) => it.isFavorite).length;
    return { total, withApis, withLicenses, favorites };
  }, [items]);

  // Loading state guard
  if (!isDbReady || !settings) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-amber-400 font-bold text-sm">
        جاري تهيئة خزنة أمان المحلية...
      </div>
    );
  }

  // If locked or PIN not set yet, render zero-overflow Login View
  if (!isUnlocked) {
    return (
      <LoginView
        isPinSet={isPinSet}
        onUnlockWithPin={handleUnlockWithPin}
        onSetupPin={handleSetupPin}
      />
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden select-none">
      {/* Dynamic Background Noise / Steel radial */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-[#03060d] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] pointer-events-none z-0" />

      {/* Main Top Navigation */}
      <div className="relative z-20 shrink-0">
        <Navbar
          onLock={() => handleLock('تم قفل وتأمين الخزنة بنجاح')}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAddModal={() => {
            setFormItem(null);
            setIsFormOpen(true);
          }}
          onExport={handleExportAman}
          soundEnabled={settings.soundEffects}
          onToggleSound={() => {
            const next = !settings.soundEffects;
            sounds.enabled = next;
            handleSaveSettings({ ...settings, soundEffects: next });
          }}
          itemCount={items.length}
        />
      </div>

      {/* Main Vault Dashboard Body (Contained within 100vh with inner scroll) */}
      <main className="relative z-10 flex-1 overflow-y-auto max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-5 space-y-3.5 sm:space-y-4">
        
        {/* Official AMAN Brand Identity Banner on Home Page */}
        <div className="p-3 sm:p-4 rounded-2xl glass-panel-elevated border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 shadow-lg">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-[0_4px_16px_rgba(0,0,0,0.6)] overflow-hidden shrink-0 flex items-center justify-center group">
              <img
                src={amanLogo}
                alt="شعار أمان Safety الرسمي"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain p-1 transform group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-100 flex items-center gap-2">
                  <span>خزانة أَمَان</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-950/70 border border-blue-600/40 text-blue-300">
                    Safety Vault
                  </span>
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-600/30 text-emerald-300 font-semibold">
                  خدمات حماية موثوقة ومحلية
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                خزانة الرموز وكلمات المرور • تشفير AES-256 معزول محلياً على جهازك دون خوادم سحابية.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Offline SQLite • 100% مشفر</span>
            </div>
          </div>
        </div>

        {/* Top Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 shrink-0">
          <div className="p-3 sm:p-3.5 rounded-2xl glass-panel-elevated flex items-center justify-between border-slate-800">
            <div>
              <div className="text-[10px] font-bold text-slate-400">إجمالي السجلات</div>
              <div className="text-lg sm:text-xl font-black font-mono text-slate-100 mt-0.5">
                {stats.total}
              </div>
            </div>
            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-amber-400">
              <Globe className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl glass-panel-elevated flex items-center justify-between border-slate-800">
            <div>
              <div className="text-[10px] font-bold text-slate-400">مفاتيح الـ API</div>
              <div className="text-lg sm:text-xl font-black font-mono text-amber-300 mt-0.5">
                {stats.withApis}
              </div>
            </div>
            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-amber-400">
              <Key className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl glass-panel-elevated flex items-center justify-between border-slate-800">
            <div>
              <div className="text-[10px] font-bold text-slate-400">التراخيص والشهادات</div>
              <div className="text-lg sm:text-xl font-black font-mono text-emerald-300 mt-0.5">
                {stats.withLicenses}
              </div>
            </div>
            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 sm:p-3.5 rounded-2xl glass-panel-elevated flex items-center justify-between border-slate-800">
            <div>
              <div className="text-[10px] font-bold text-slate-400">السجلات المفضلة</div>
              <div className="text-lg sm:text-xl font-black font-mono text-amber-400 mt-0.5">
                {stats.favorites}
              </div>
            </div>
            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
        </div>

        {/* Search, Filter, Sort & View Mode Switcher Panel */}
        <div className="p-3 sm:p-4 rounded-2xl glass-panel-elevated border-slate-800 space-y-3 shrink-0">
          
          {/* Row 1: Search + Favorites + Sort + View Mode */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
            
            {/* Search Input with Microphone Voice Recognition */}
            <div className="relative flex-1">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isListening
                    ? '🎙️ جاري الاستماع... تحدث الآن للبحث في الخزنة...'
                    : 'بحث سريع باسم الموقع، الرابط، اسم المستخدم، مفتاح API، أو رقم الترخيص...'
                }
                className={`w-full pr-10 pl-20 py-2 rounded-xl bg-slate-900/90 border text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                  isListening
                    ? 'border-rose-500/80 ring-2 ring-rose-500/30 bg-slate-900 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                    : 'border-slate-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
                }`}
              />
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-[11px] text-slate-400 hover:text-slate-200 px-1 py-0.5 rounded cursor-pointer"
                    title="مسح البحث"
                  >
                    مسح
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleVoiceSearch}
                  title={isListening ? 'إيقاف البحث الصوتي' : 'البحث الصوتي (تحويل الصوت إلى نص)'}
                  aria-label={isListening ? 'إيقاف البحث الصوتي' : 'البحث الصوتي'}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                    isListening
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 animate-pulse ring-2 ring-rose-400/50'
                      : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800/80'
                  }`}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4 text-white" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Quick Filter & View Modes Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              
              {/* Favorites Filter */}
              <button
                type="button"
                onClick={() => setOnlyFavorites(!onlyFavorites)}
                className={`vault-btn-3d flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer shrink-0 ${
                  onlyFavorites ? 'text-amber-300 border-amber-500/50' : 'text-slate-300'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
                <span>المفضلة</span>
              </button>

              {/* Sort Selector */}
              <div className="relative shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'title')}
                  className="vault-btn-3d py-2 pr-7 pl-3 rounded-xl text-xs font-bold text-slate-200 bg-slate-900 border border-slate-700 focus:outline-none cursor-pointer appearance-none"
                >
                  <option value="newest">الأحدث</option>
                  <option value="oldest">الأقدم</option>
                  <option value="title">أبجدياً</option>
                </select>
                <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* View Modes Toggle (Cards, Compact, List) */}
              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  title="عرض البطائق ثلاثية الأبعاد"
                  className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('compact')}
                  title="عرض مدمج قابل للتوسيع"
                  className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                    viewMode === 'compact'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  title="عرض جدول تفصيلي"
                  className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Expand / Collapse All for Compact mode */}
              {viewMode === 'compact' && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => expandAllItems(true)}
                    className="p-1.5 rounded-lg bg-slate-900 text-slate-300 hover:text-amber-300 text-xs border border-slate-800 cursor-pointer"
                    title="توسيع كافة السجلات"
                  >
                    <ChevronsDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => expandAllItems(false)}
                    className="p-1.5 rounded-lg bg-slate-900 text-slate-300 hover:text-amber-300 text-xs border border-slate-800 cursor-pointer"
                    title="طي كافة السجلات"
                  >
                    <ChevronsUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* Row 2: Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'all'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              <span>الكل</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                {items.length}
              </span>
            </button>

            {categories.map((cat) => {
              const count = items.filter((it) => it.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400'
                      : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: cat.glowColor || '#fbbf24' }}
                  />
                  <span>{cat.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Credentials Views Container */}
        {filteredItems.length > 0 ? (
          <div>
            {/* 1. Standard 3D Cards Grid */}
            {viewMode === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {filteredItems.map((item) => {
                  const safeCategories = Array.isArray(categories) ? categories : [];
                  const cat = safeCategories.find((c) => c && c.id === item.category);
                  return (
                    <ItemCard
                      key={item.id}
                      item={item}
                      category={cat}
                      clipboardTimeout={settings?.clipboardTimeoutSeconds ?? 30}
                      onView={(it) => setViewItem(it)}
                      onEdit={(it) => {
                        setFormItem(it);
                        setIsFormOpen(true);
                      }}
                      onDelete={handleDeleteItem}
                      onDuplicate={handleDuplicateItem}
                      onToggleFavorite={handleToggleFavorite}
                      onCopiedToast={showToast}
                    />
                  );
                })}
              </div>
            )}

            {/* 2. Compact Expandable Cards */}
            {viewMode === 'compact' && (
              <div className="space-y-2.5 pb-4">
                {filteredItems.map((item) => {
                  const safeCategories = Array.isArray(categories) ? categories : [];
                  const cat = safeCategories.find((c) => c && c.id === item.category);
                  return (
                    <ItemCompactCard
                      key={item.id}
                      item={item}
                      category={cat}
                      clipboardTimeout={settings?.clipboardTimeoutSeconds ?? 30}
                      isExpanded={Boolean(expandedItems[item.id])}
                      onToggleExpand={() => toggleItemExpansion(item.id)}
                      onView={(it) => setViewItem(it)}
                      onEdit={(it) => {
                        setFormItem(it);
                        setIsFormOpen(true);
                      }}
                      onDelete={handleDeleteItem}
                      onDuplicate={handleDuplicateItem}
                      onToggleFavorite={handleToggleFavorite}
                      onCopiedToast={showToast}
                    />
                  );
                })}
              </div>
            )}

            {/* 3. Detailed Data Table View */}
            {viewMode === 'list' && (
              <div className="pb-4">
                <ItemListView
                  items={filteredItems}
                  categories={Array.isArray(categories) ? categories : []}
                  onView={(it) => setViewItem(it)}
                  onEdit={(it) => {
                    setFormItem(it);
                    setIsFormOpen(true);
                  }}
                  onDelete={handleDeleteItem}
                  onDuplicate={handleDuplicateItem}
                  onToggleFavorite={handleToggleFavorite}
                />
              </div>
            )}
          </div>
        ) : (
          /* Empty Search or Zero Items State */
          <div className="p-8 sm:p-12 rounded-3xl glass-panel-elevated border-slate-800 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-700/80 p-2 flex items-center justify-center shadow-lg overflow-hidden">
              <img
                src={amanLogo}
                alt="شعار أمان Safety"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-200">لا توجد عناصر مطابقة في الخزنة</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                {searchQuery || selectedCategory !== 'all' || onlyFavorites
                  ? 'لم نتمكن من العثور على أي نتائج تطابق معايير الفلترة أو البحث الحالية.'
                  : 'الخزنة فارغة حالياً. ابدأ بإضافة بيانات أول موقع أو ترخيص ترغب في حفظه بأمان.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setOnlyFavorites(false);
                setFormItem(null);
                setIsFormOpen(true);
              }}
              className="gold-btn-3d px-4 py-2 rounded-xl text-xs font-bold text-slate-950 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة عنصر جديد للخزنة</span>
            </button>
          </div>
        )}

      </main>

      {/* Persistent Bottom Hallmark strictly as requested */}
      <footer className="relative z-10 w-full py-2.5 px-4 sm:px-6 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-right shrink-0">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>الخزنة مشفرة محلياً • حفظ تلقائي في جهازك بدون خوادم خارجية</span>
        </div>

        {/* The Exact User Requested Hallmark */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] text-xs font-bold text-amber-300/95 tracking-wide">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>تصميم : عبدالله المخلافي 2026</span>
        </div>
      </footer>

      {/* MODALS */}

      {/* 1. Item Detail Inspection Modal */}
      {viewItem && (
        <FeatureErrorBoundary featureName="تفاصيل العنصر" onDismiss={() => setViewItem(null)}>
          <ItemDetailModal
            item={viewItem}
            category={(Array.isArray(categories) ? categories : []).find((c) => c && c.id === viewItem?.category)}
            clipboardTimeout={settings?.clipboardTimeoutSeconds ?? 30}
            onClose={() => setViewItem(null)}
            onEdit={(it) => {
              setViewItem(null);
              setFormItem(it);
              setIsFormOpen(true);
            }}
            onDelete={handleDeleteItem}
            onDuplicate={handleDuplicateItem}
            onCopiedToast={showToast}
          />
        </FeatureErrorBoundary>
      )}

      {/* 2. Add / Edit Modal */}
      {isFormOpen && (
        <FeatureErrorBoundary
          featureName="نموذج السجل"
          onDismiss={() => {
            setIsFormOpen(false);
            setFormItem(null);
          }}
        >
          <ItemFormModal
            isOpen={isFormOpen}
            item={formItem}
            categories={categories}
            allItems={items}
            existingItems={items}
            onClose={() => {
              setIsFormOpen(false);
              setFormItem(null);
            }}
            onSave={handleSaveItem}
            onOpenExisting={(it) => {
              setIsFormOpen(false);
              setFormItem(null);
              setViewItem(it);
            }}
          />
        </FeatureErrorBoundary>
      )}

      {/* 3. Settings / Control Panel Modal */}
      {isSettingsOpen && (
        <FeatureErrorBoundary featureName="إعدادات الخزنة" onDismiss={() => setIsSettingsOpen(false)}>
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={settings}
            onSaveSettings={handleSaveSettings}
            categories={categories}
            onSaveCategories={handleSaveCategories}
            items={items}
            auditLogs={auditLogs}
            onClearAuditLogs={handleClearAuditLogs}
            onExportAman={handleExportAman}
            onImportAman={handleImportAman}
            onExportExcel={handleExportExcel}
            onExportSqlite={handleExportSqlite}
            onGenerate100Items={handleGenerate100Items}
            onResetDatabase={handleResetDatabase}
            onChangePin={handleChangePin}
          />
        </FeatureErrorBoundary>
      )}

      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 px-3.5 py-2 rounded-xl bg-slate-900/95 border border-amber-500/40 text-xs font-bold text-amber-200 shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
