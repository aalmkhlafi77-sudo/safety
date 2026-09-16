import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Globe,
  User,
  Lock,
  Key,
  Award,
  FileText,
  RefreshCw,
  Sparkles,
  Star,
  Check,
  Plus,
  Trash2,
  AlertTriangle,
  ExternalLink,
  Sliders,
  Eye,
  EyeOff,
  Shield,
  Layers,
} from 'lucide-react';
import { VaultItem, Category, MultiEntry } from '../types';
import { sounds } from '../utils/audio';
import { safeString, safeToLowerCase, safeArray, normalizeMultiEntry, normalizeVaultItem } from '../utils/searchSafety';

interface ItemFormModalProps {
  isOpen: boolean;
  item: VaultItem | null;
  allItems?: VaultItem[];
  existingItems?: VaultItem[];
  categories: Category[];
  onClose: () => void;
  onSave: (item: VaultItem) => void;
  onOpenExisting?: (existingItem: VaultItem) => void;
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  isOpen,
  item,
  allItems = [],
  existingItems = [],
  categories = [],
  onClose,
  onSave,
  onOpenExisting,
}) => {
  // Support both allItems and existingItems prop names safely
  const itemsList = Array.isArray(allItems) && allItems.length > 0
    ? allItems
    : Array.isArray(existingItems)
    ? existingItems
    : [];

  // Basic Information
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [category, setCategory] = useState('web');
  const [isFavorite, setIsFavorite] = useState(false);

  // Credentials
  const [url, setUrl] = useState('');
  const [additionalUrls, setAdditionalUrls] = useState<MultiEntry[]>([]);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Multiple Keys & Tokens
  const [apiKeys, setApiKeys] = useState<MultiEntry[]>([]);
  const [tokens, setTokens] = useState<MultiEntry[]>([]);
  const [secretKeys, setSecretKeys] = useState<MultiEntry[]>([]);

  // Multiple Licenses & Certificates
  const [licenseKeys, setLicenseKeys] = useState<MultiEntry[]>([]);
  const [certificates, setCertificates] = useState<MultiEntry[]>([]);

  // Notes
  const [notes, setNotes] = useState('');
  const [secretNotes, setSecretNotes] = useState('');

  // UI States
  const [activeTab, setActiveTab] = useState<'basic' | 'credentials' | 'keys' | 'licenses' | 'notes'>('basic');
  const [formError, setFormError] = useState('');
  const [showGenerator, setShowGenerator] = useState(false);

  // Password Generator settings
  const [pwLength, setPwLength] = useState(16);
  const [pwUppercase, setPwUppercase] = useState(true);
  const [pwLowercase, setPwLowercase] = useState(true);
  const [pwNumbers, setPwNumbers] = useState(true);
  const [pwSymbols, setPwSymbols] = useState(true);
  const [pwExcludeAmbiguous, setPwExcludeAmbiguous] = useState(true);

  // Duplicate warning override
  const [ignoreDuplicateWarning, setIgnoreDuplicateWarning] = useState(false);

  // Derive stable category default without triggering re-runs
  const defaultCatId = categories && categories.length > 0 ? categories[0].id : 'web';
  const itemId = item?.id ?? null;

  useEffect(() => {
    if (!isOpen) return;
    if (item) {
      setTitle(safeString(item.title));
      setDescription(safeString(item.description));
      setWebsite(safeString(item.website));
      setCategory(item.category || defaultCatId);
      setIsFavorite(Boolean(item.isFavorite));
      setUrl(safeString(item.url));
      setAdditionalUrls(safeArray(item.urls).map((e, idx) => normalizeMultiEntry(e, `url_${idx}`)));
      setUsername(safeString(item.username));
      setEmail(safeString(item.email));
      setPassword(safeString(item.password));
      setApiKeys(safeArray(item.apiKeys).map((e, idx) => normalizeMultiEntry(e, `key_${idx}`)));
      setTokens(safeArray(item.tokens).map((e, idx) => normalizeMultiEntry(e, `tok_${idx}`)));
      setSecretKeys(safeArray(item.secretKeys).map((e, idx) => normalizeMultiEntry(e, `sec_${idx}`)));
      setLicenseKeys(safeArray(item.licenseKeys).map((e, idx) => normalizeMultiEntry(e, `lic_${idx}`)));
      setCertificates(safeArray(item.certificates).map((e, idx) => normalizeMultiEntry(e, `cert_${idx}`)));
      setNotes(safeString(item.notes));
      setSecretNotes(safeString(item.secretNotes));
    } else {
      setTitle('');
      setDescription('');
      setWebsite('');
      setCategory(defaultCatId);
      setIsFavorite(false);
      setUrl('');
      setAdditionalUrls([]);
      setUsername('');
      setEmail('');
      setPassword('');
      setApiKeys([]);
      setTokens([]);
      setSecretKeys([]);
      setLicenseKeys([]);
      setCertificates([]);
      setNotes('');
      setSecretNotes('');
    }
    setActiveTab('basic');
    setFormError('');
    setShowGenerator(false);
    setIgnoreDuplicateWarning(false);
  }, [isOpen, itemId]);

  // Duplicate detector (Crash-proof with safe null/undefined handling and min length >= 2)
  const duplicateItem = useMemo(() => {
    const rawTitle = safeString(title).trim();
    const rawUrl = safeString(url).trim();

    if (!isOpen || item || !rawTitle || rawTitle.length < 2 || ignoreDuplicateWarning) return null;
    const cleanTitle = rawTitle.toLowerCase();
    const cleanUrl = rawUrl.toLowerCase();

    try {
      return (itemsList || []).find((other) => {
        if (!other || typeof other !== 'object') return false;
        const otherTitle = safeToLowerCase(other.title).trim();
        const matchTitle = otherTitle.length > 0 && otherTitle === cleanTitle;
        const otherUrl = safeToLowerCase(other.url).trim();
        const matchUrl = Boolean(cleanUrl && otherUrl && otherUrl === cleanUrl);
        return Boolean(matchTitle || matchUrl);
      }) || null;
    } catch {
      return null;
    }
  }, [isOpen, title, url, itemsList, item, ignoreDuplicateWarning]);

  // Password strength calculator (Unconditional Hook)
  const passwordStrength = useMemo(() => {
    const pwd = safeString(password);
    if (!pwd) return { label: 'فارغة', score: 0, color: 'bg-slate-700' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 14) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { label: 'ضعيفة', score, color: 'bg-rose-500' };
    if (score <= 3) return { label: 'متوسطة', score, color: 'bg-amber-500' };
    if (score <= 4) return { label: 'قوية', score, color: 'bg-emerald-500' };
    return { label: 'خارقة للأمان', score, color: 'bg-emerald-400' };
  }, [password]);

  if (!isOpen) return null;

  // Advanced Password Generator
  const generateCustomPassword = () => {
    sounds.playKeypadClick();
    let charset = '';
    if (pwUppercase) charset += 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    if (pwLowercase) charset += 'abcdefghijkmnpqrstuvwxyz';
    if (pwNumbers) charset += '23456789';
    if (pwSymbols) charset += '!@#$%^&*()_+~|}{[]:;?><,.-=';

    if (!pwExcludeAmbiguous) {
      if (pwUppercase) charset += 'IO';
      if (pwLowercase) charset += 'lo';
      if (pwNumbers) charset += '01';
    }

    if (!charset) charset = 'abcdefghijklmnopqrstuvwxyz0123456789';

    let result = '';
    const array = new Uint32Array(pwLength);
    crypto.getRandomValues(array);
    for (let i = 0; i < pwLength; i++) {
      result += charset[array[i] % charset.length];
    }
    setPassword(result);
  };

  // Handlers for dynamic array items
  const addMultiEntry = (
    setter: React.Dispatch<React.SetStateAction<MultiEntry[]>>,
    defaultLabel: string = ''
  ) => {
    sounds.playKeypadClick();
    setter((prev) => [...prev, { id: `m_${Date.now()}_${Math.random()}`, label: defaultLabel, value: '' }]);
  };

  const removeMultiEntry = (
    setter: React.Dispatch<React.SetStateAction<MultiEntry[]>>,
    id: string
  ) => {
    sounds.playKeypadClick();
    setter((prev) => prev.filter((entry) => entry.id !== id));
  };

  const updateMultiEntry = (
    setter: React.Dispatch<React.SetStateAction<MultiEntry[]>>,
    id: string,
    field: 'label' | 'value',
    val: string
  ) => {
    setter((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, [field]: val } : entry))
    );
  };

  const handleSubmit = (e?: React.SyntheticEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    const cleanTitle = safeString(title).trim();
    if (!cleanTitle) {
      setFormError('يرجى كتابة اسم الموقع أو العنصر أولاً');
      setActiveTab('basic');
      return;
    }

    if (duplicateItem && !ignoreDuplicateWarning) {
      return; // Must acknowledge duplicate
    }

    sounds.playUnlock();

    const cleanField = (s: unknown) => safeString(s).trim();
    const cleanList = (list: unknown) => {
      if (!Array.isArray(list)) return [];
      return list
        .filter((entry) => entry && (cleanField(entry.value) || cleanField(entry.label)))
        .map((entry) => ({
          id: cleanField(entry.id) || Date.now().toString(),
          label: cleanField(entry.label),
          value: cleanField(entry.value),
        }));
    };

    const savedItem: VaultItem = {
      id: item?.id ? item.id : Date.now().toString(),
      title: cleanField(title),
      description: cleanField(description),
      website: cleanField(website),
      category: cleanField(category) || 'web',
      isFavorite: Boolean(isFavorite),
      url: cleanField(url),
      urls: cleanList(additionalUrls),
      username: cleanField(username),
      email: cleanField(email),
      password: cleanField(password),
      apiKeys: cleanList(apiKeys),
      tokens: cleanList(tokens),
      secretKeys: cleanList(secretKeys),
      licenseKeys: cleanList(licenseKeys),
      certificates: cleanList(certificates),
      notes: cleanField(notes),
      secretNotes: cleanField(secretNotes),
      createdAt: item?.createdAt ? item.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(normalizeVaultItem(savedItem));
  };

  return (
    <div
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-hidden"
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl glass-panel-elevated p-4 sm:p-6 border border-slate-700/80 shadow-[0_25px_60px_rgba(0,0,0,0.85)] text-right animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Rivets */}
        <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-slate-600" />
        <div className="absolute top-3 left-3 w-1.5 h-1.5 rounded-full bg-slate-600" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>{item ? 'تعديل بيانات السجل' : 'إضافة سجل جديد إلى الخزنة'}</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              تشفير AES-256 محلي مع حفظ فوري في قاعدة بيانات الجهاز
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Duplicate Item Alert Warning Banner */}
        {duplicateItem && !ignoreDuplicateWarning && (
          <div className="mt-3 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>تنبيه تكرار:</strong> يوجد عنصر مشابه محفوظ مسبقاً بعنوان: «{safeString(duplicateItem.title) || 'عنصر مشابه'}».
              </span>
            </div>
            <div className="flex items-center gap-2">
              {typeof onOpenExisting === 'function' && (
                <button
                  type="button"
                  onClick={() => onOpenExisting(duplicateItem)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/30 hover:bg-amber-500/40 text-amber-100 font-bold transition text-[11px] cursor-pointer"
                >
                  فتح العنصر الموجود
                </button>
              )}
              <button
                type="button"
                onClick={() => setIgnoreDuplicateWarning(true)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition text-[11px] cursor-pointer"
              >
                إضافة على أي حال
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs (Zero overcrowding) */}
        <div className="flex items-center gap-1.5 mt-3 p-1 rounded-xl bg-slate-900/90 border border-slate-800 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'basic'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>البيانات الأساسية</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('credentials')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'credentials'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>الحساب وكلمة المرور</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('keys')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'keys'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>مفاتيح API والتوكنات</span>
            {(apiKeys.length > 0 || tokens.length > 0 || secretKeys.length > 0) && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('licenses')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'licenses'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>التراخيص والشهادات</span>
            {(licenseKeys.length > 0 || certificates.length > 0) && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'notes'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>الملاحظات السرية</span>
          </button>
        </div>

        {/* Error Message */}
        {formError && (
          <div className="mt-2 p-2 rounded-xl bg-rose-950/60 border border-rose-800 text-xs font-semibold text-rose-300 shrink-0">
            {formError}
          </div>
        )}

        {/* Form Body - Scrollable content strictly inside */}
        <div
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          className="flex-1 overflow-y-auto mt-3 pr-1 pl-1 space-y-4"
        >
          
          {/* TAB 1: BASIC INFORMATION */}
          {activeTab === 'basic' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  اسم الموقع أو الخدمة <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="مثال: GitHub Enterprise, بوابة Cloudflare, خادم AWS..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  الموقع أو الشركة المزودة
                </label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="مثال: Google Cloud, Microsoft, Amazon..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  وصف قصير
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="نبذة موجزة عن هذا الحساب والغرض من استخدامه..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Category Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  التصنيف / المصنف
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(categories || []).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                        category === cat.id
                          ? 'bg-amber-500/20 border border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                          : 'bg-slate-900/70 border border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Favorite Toggle */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-2">
                  <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold text-slate-200">إضافة للمفضلة</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                    isFavorite ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      isFavorite ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CREDENTIALS & PASSWORDS */}
          {activeTab === 'credentials' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Primary External URL */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                  <span>رابط تسجيل الدخول الرئيسي (يفتح في المتصفح الخارجي)</span>
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  dir="ltr"
                  placeholder="https://console.example.com"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 font-mono text-xs text-blue-300 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Additional URLs */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-300">روابط إضافية ذات صلة</span>
                  <button
                    type="button"
                    onClick={() => addMultiEntry(setAdditionalUrls, 'رابط إضافي')}
                    className="text-[11px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ إضافة رابط آخر</span>
                  </button>
                </div>
                {(additionalUrls || []).map((u) => (
                  <div key={u.id} className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={safeString(u.label)}
                      onChange={(e) => updateMultiEntry(setAdditionalUrls, u.id, 'label', e.target.value)}
                      placeholder="تسمية الرابط (لوحة التحكم، الـ API...)"
                      className="w-1/3 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200"
                    />
                    <input
                      type="text"
                      value={safeString(u.value)}
                      onChange={(e) => updateMultiEntry(setAdditionalUrls, u.id, 'value', e.target.value)}
                      dir="ltr"
                      placeholder="https://..."
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-xs text-blue-300"
                    />
                    <button
                      type="button"
                      onClick={() => removeMultiEntry(setAdditionalUrls, u.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Username & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    اسم المستخدم / المعرف
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="user_admin أو المعرف"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    dir="ltr"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Password with Show/Hide & Generator */}
              <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>كلمة المرور</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowGenerator(!showGenerator)}
                      className="text-[11px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>{showGenerator ? 'إخفاء المولد' : 'مولد كلمات المرور'}</span>
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    dir="ltr"
                    placeholder="أدخل كلمة المرور أو ولّد واحدة قوية..."
                    className="w-full pr-10 pl-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700/90 font-mono text-xs text-amber-300 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <div className="flex items-center gap-1">
                      <span>قوة كلمة المرور:</span>
                      <span className="font-bold text-slate-200">{passwordStrength.label}</span>
                    </div>
                    <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full ${passwordStrength.color} transition-all duration-300`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Expanded Advanced Password Generator Options */}
                {showGenerator && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300">طول كلمة المرور: {pwLength}</span>
                      <input
                        type="range"
                        min={8}
                        max={40}
                        value={pwLength}
                        onChange={(e) => setPwLength(Number(e.target.value))}
                        className="w-36 accent-amber-400 cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={pwUppercase}
                          onChange={(e) => setPwUppercase(e.target.checked)}
                          className="accent-amber-400 rounded"
                        />
                        <span>أحرف كبيرة (A-Z)</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={pwLowercase}
                          onChange={(e) => setPwLowercase(e.target.checked)}
                          className="accent-amber-400 rounded"
                        />
                        <span>أحرف صغيرة (a-z)</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={pwNumbers}
                          onChange={(e) => setPwNumbers(e.target.checked)}
                          className="accent-amber-400 rounded"
                        />
                        <span>أرقام (0-9)</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={pwSymbols}
                          onChange={(e) => setPwSymbols(e.target.checked)}
                          className="accent-amber-400 rounded"
                        />
                        <span>رموز خاصة (!@#$)</span>
                      </label>

                      <label className="col-span-2 flex items-center gap-1.5 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={pwExcludeAmbiguous}
                          onChange={(e) => setPwExcludeAmbiguous(e.target.checked)}
                          className="accent-amber-400 rounded"
                        />
                        <span>استبعاد الأحرف المتشابهة (1, l, I, 0, O)</span>
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={generateCustomPassword}
                      className="w-full py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>توليد وتطبيق كلمة مرور جديدة</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: API KEYS & TOKENS */}
          {activeTab === 'keys' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* API Keys Multiple */}
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" />
                    <span>مفاتيح الـ API (API Keys)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => addMultiEntry(setApiKeys, 'Production API Key')}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ إضافة مفتاح API</span>
                  </button>
                </div>

                {(apiKeys || []).length === 0 ? (
                  <p className="text-[11px] text-slate-500">لا توجد مفاتيح API مسجلة. اضغط + لإضافة مفتاح.</p>
                ) : (
                  (apiKeys || []).map((k) => (
                    <div key={k.id} className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={safeString(k.label)}
                        onChange={(e) => updateMultiEntry(setApiKeys, k.id, 'label', e.target.value)}
                        placeholder="تسمية المفتاح (Live, Test...)"
                        className="w-1/3 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200"
                      />
                      <input
                        type="text"
                        value={safeString(k.value)}
                        onChange={(e) => updateMultiEntry(setApiKeys, k.id, 'value', e.target.value)}
                        dir="ltr"
                        placeholder="key_live_..."
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 font-mono text-xs text-amber-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeMultiEntry(setApiKeys, k.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Tokens Multiple */}
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" />
                    <span>التوكنات السرية (Tokens)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => addMultiEntry(setTokens, 'Bearer Token')}
                    className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ إضافة توكن</span>
                  </button>
                </div>

                {(tokens || []).length === 0 ? (
                  <p className="text-[11px] text-slate-500">لا توجد توكنات مسجلة.</p>
                ) : (
                  (tokens || []).map((t) => (
                    <div key={t.id} className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={safeString(t.label)}
                        onChange={(e) => updateMultiEntry(setTokens, t.id, 'label', e.target.value)}
                        placeholder="اسم التوكن (GitHub Token, OAuth...)"
                        className="w-1/3 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200"
                      />
                      <input
                        type="text"
                        value={safeString(t.value)}
                        onChange={(e) => updateMultiEntry(setTokens, t.id, 'value', e.target.value)}
                        dir="ltr"
                        placeholder="ghp_..."
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 font-mono text-xs text-cyan-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeMultiEntry(setTokens, t.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Secret Keys Multiple */}
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    <span>مفاتيح التشفير والـ Secret Keys</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => addMultiEntry(setSecretKeys, 'Webhook Secret')}
                    className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ إضافة مفتاح سري</span>
                  </button>
                </div>

                {(secretKeys || []).length === 0 ? (
                  <p className="text-[11px] text-slate-500">لا توجد مفاتيح سرية مسجلة.</p>
                ) : (
                  (secretKeys || []).map((s) => (
                    <div key={s.id} className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={safeString(s.label)}
                        onChange={(e) => updateMultiEntry(setSecretKeys, s.id, 'label', e.target.value)}
                        placeholder="تسمية المفتاح (Client Secret, AES Key...)"
                        className="w-1/3 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200"
                      />
                      <input
                        type="text"
                        value={safeString(s.value)}
                        onChange={(e) => updateMultiEntry(setSecretKeys, s.id, 'value', e.target.value)}
                        dir="ltr"
                        placeholder="sk_live_..."
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 font-mono text-xs text-rose-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeMultiEntry(setSecretKeys, s.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: LICENSES & CERTIFICATES */}
          {activeTab === 'licenses' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Licenses */}
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" />
                    <span>أرقام التراخيص (License Keys)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => addMultiEntry(setLicenseKeys, 'ترخيص برمجيات')}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ إضافة ترخيص</span>
                  </button>
                </div>

                {(licenseKeys || []).length === 0 ? (
                  <p className="text-[11px] text-slate-500">لا توجد تراخيص مسجلة.</p>
                ) : (
                  (licenseKeys || []).map((l) => (
                    <div key={l.id} className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={safeString(l.label)}
                        onChange={(e) => updateMultiEntry(setLicenseKeys, l.id, 'label', e.target.value)}
                        placeholder="البرنامج (Windows Pro, Adobe...)"
                        className="w-1/3 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200"
                      />
                      <input
                        type="text"
                        value={safeString(l.value)}
                        onChange={(e) => updateMultiEntry(setLicenseKeys, l.id, 'value', e.target.value)}
                        dir="ltr"
                        placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 font-mono text-xs text-emerald-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeMultiEntry(setLicenseKeys, l.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Certificates */}
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    <span>الشهادات الرقمية والـ Certificates</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => addMultiEntry(setCertificates, 'شهادة SSL')}
                    className="text-[11px] font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ إضافة شهادة</span>
                  </button>
                </div>

                {(certificates || []).length === 0 ? (
                  <p className="text-[11px] text-slate-500">لا توجد شهادات رقمية مسجلة.</p>
                ) : (
                  (certificates || []).map((c) => (
                    <div key={c.id} className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={safeString(c.label)}
                        onChange={(e) => updateMultiEntry(setCertificates, c.id, 'label', e.target.value)}
                        placeholder="اسم الشهادة (DigiCert SSL...)"
                        className="w-1/3 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200"
                      />
                      <input
                        type="text"
                        value={safeString(c.value)}
                        onChange={(e) => updateMultiEntry(setCertificates, c.id, 'value', e.target.value)}
                        dir="ltr"
                        placeholder="رقم أو مرجع الشهادة..."
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 font-mono text-xs text-teal-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeMultiEntry(setCertificates, c.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: NOTES & SECRET NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  ملاحظات عامة
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي تعليمات أو ملاحظات عامة حول هذا الحساب..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-rose-300 mb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>ملاحظات سرية مشفرة بـ AES-256</span>
                </label>
                <textarea
                  rows={3}
                  value={secretNotes}
                  onChange={(e) => setSecretNotes(e.target.value)}
                  placeholder="رموز استرداد، إجابات أسئلة أمان، أكواد سرية..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-rose-900/50 text-xs text-rose-200 placeholder-slate-500 focus:outline-none focus:border-rose-400 resize-none leading-relaxed"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  يتم تشفير هذه الملاحظات في قاعدة البيانات بنفس مستوى تشفير كلمات المرور.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>حفظ فوري في SQLite المحلي</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="gold-btn-3d px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-950 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 text-slate-950" />
              <span>{item ? 'حفظ التعديلات' : 'إضافة إلى الخزنة'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
