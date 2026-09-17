import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Eye,
  EyeOff,
  Key,
  Award,
  Globe,
  User,
  Lock,
  FileText,
  Calendar,
  Edit2,
  Trash2,
  CopyPlus,
  Shield,
  Mail,
  Layers,
} from 'lucide-react';
import { VaultItem, Category, MultiEntry } from '../types';
import { sounds } from '../utils/audio';
import { copySensitiveText, copyPlainText } from '../utils/clipboard';
import { sanitizeAndOpenUrl } from '../utils/url';
import { safeString, safeArray } from '../utils/searchSafety';

interface ItemDetailModalProps {
  item: VaultItem | null;
  category?: Category;
  clipboardTimeout?: number;
  onClose: () => void;
  onEdit: (item: VaultItem) => void;
  onDelete: (id: string) => void;
  onDuplicate: (item: VaultItem) => void;
  onCopiedToast?: (msg: string) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  category,
  clipboardTimeout = 30,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onCopiedToast,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showSecretNotes, setShowSecretNotes] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!item) return null;

  const toggleRevealKey = (id: string) => {
    setRevealedKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopySensitive = async (text: string, fieldName: string) => {
    if (!text) return;
    sounds.playKeypadClick();
    setCopiedField(fieldName);

    await copySensitiveText(
      text,
      clipboardTimeout,
      () => {
        if (onCopiedToast) {
          onCopiedToast(
            clipboardTimeout > 0
              ? `تم النسخ • مسح تلقائي بعد ${clipboardTimeout} ثانية`
              : 'تم النسخ إلى الحافظة'
          );
        }
      },
      () => {
        if (onCopiedToast) onCopiedToast('تم مسح القيمة السرية من الحافظة تلقائياً للأمان');
      }
    );

    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const handleCopyNormal = async (text: string, fieldName: string) => {
    if (!text) return;
    sounds.playKeypadClick();
    setCopiedField(fieldName);
    await copyPlainText(text);
    if (onCopiedToast) onCopiedToast('تم النسخ إلى الحافظة');
    setTimeout(() => {
      setCopiedField(null);
    }, 1800);
  };

  const handleOpenUrl = async (targetUrl?: string) => {
    if (!targetUrl) return;
    sounds.playKeypadClick();
    await sanitizeAndOpenUrl(targetUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-hidden">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl glass-panel-elevated p-4 sm:p-6 border border-slate-700/80 shadow-[0_25px_60px_rgba(0,0,0,0.85)] text-right animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Rivets */}
        <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-slate-600" />
        <div className="absolute top-3 left-3 w-1.5 h-1.5 rounded-full bg-slate-600" />

        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-amber-300">
                {category?.name || 'عام'}
              </span>
              {item.isFavorite && (
                <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  مفضل ★
                </span>
              )}
              {item.website && (
                <span className="text-[11px] font-medium text-slate-400">
                  • {item.website}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight break-words">
              {item.title}
            </h2>
            {item.description && (
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                {item.description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Fields Container (Zero overflow, inner scrollable) */}
        <div className="flex-1 overflow-y-auto mt-3 pr-1 pl-1 space-y-3">
          
          {/* Main Website URL */}
          {item.url && (
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold text-slate-400">رابط الموقع الخارجي</div>
                  <div className="font-mono text-xs text-blue-300 truncate" dir="ltr">
                    {item.url}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleCopyNormal(item.url, 'url')}
                  className="vault-btn-3d px-2.5 py-1 rounded-lg text-xs font-bold text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  {copiedField === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>نسخ</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenUrl(item.url)}
                  className="gold-btn-3d px-3 py-1 rounded-lg text-xs font-bold text-slate-950 flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>فتح في المتصفح</span>
                </button>
              </div>
            </div>
          )}

          {/* Additional URLs */}
          {safeArray<MultiEntry>(item.urls).length > 0 && (
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-300">روابط إضافية:</div>
              {safeArray<MultiEntry>(item.urls).map((u, idx) => {
                const uId = safeString(u?.id) || `url_${idx}`;
                const uLabel = safeString(u?.label) || 'رابط';
                const uVal = safeString(u?.value);
                return (
                  <div key={uId} className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-slate-400 text-[11px] font-medium">{uLabel}:</span>
                      <span className="font-mono text-blue-300 truncate" dir="ltr">{uVal}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyNormal(uVal, uId)}
                        className="p-1 text-slate-400 hover:text-amber-400 cursor-pointer"
                      >
                        {copiedField === uId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenUrl(uVal)}
                        className="p-1 text-slate-400 hover:text-blue-400 cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Username & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {item.username && (
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-slate-400">اسم المستخدم / المعرف</div>
                    <div className="font-mono text-xs text-slate-100 truncate select-all">{item.username}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyNormal(item.username, 'username')}
                  className="vault-btn-3d px-2 py-1 rounded-lg text-xs font-bold text-slate-200 cursor-pointer shrink-0"
                >
                  {copiedField === 'username' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            {item.email && (
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-slate-400">البريد الإلكتروني</div>
                    <div className="font-mono text-xs text-slate-100 truncate select-all">{item.email}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyNormal(item.email, 'email')}
                  className="vault-btn-3d px-2 py-1 rounded-lg text-xs font-bold text-slate-200 cursor-pointer shrink-0"
                >
                  {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Password (Toggleable & Copyable) */}
          {item.password && (
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold text-slate-400">كلمة المرور</div>
                  <div className="font-mono text-xs sm:text-sm text-amber-200 tracking-wider break-all select-all">
                    {showPassword ? item.password : '••••••••••••••••••••'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="vault-btn-3d px-2.5 py-1 rounded-lg text-xs font-bold text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'إخفاء' : 'إظهار'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopySensitive(item.password, 'password')}
                  className="vault-btn-3d px-2.5 py-1 rounded-lg text-xs font-bold text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  {copiedField === 'password' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>نسخ مؤمن</span>
                </button>
              </div>
            </div>
          )}

          {/* API Keys Multiple */}
          {safeArray<MultiEntry>(item.apiKeys).length > 0 && (
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Key className="w-4 h-4" />
                <span>مفاتيح الـ API ({safeArray<MultiEntry>(item.apiKeys).length})</span>
              </div>
              {safeArray<MultiEntry>(item.apiKeys).map((keyEntry, idx) => {
                const kId = safeString(keyEntry?.id) || `key_${idx}`;
                const kLabel = safeString(keyEntry?.label) || 'API Key';
                const kVal = safeString(keyEntry?.value);
                return (
                  <div key={kId} className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="font-bold text-slate-300">{kLabel}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleRevealKey(kId)}
                          className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          {revealedKeys[kId] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopySensitive(kVal, kId)}
                          className="p-1 text-slate-400 hover:text-amber-400 cursor-pointer"
                        >
                          {copiedField === kId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="font-mono text-xs text-amber-200/90 break-all select-all">
                      {revealedKeys[kId] ? kVal : '••••••••••••••••••••••••••••••••'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tokens & Secret Keys */}
          {(safeArray<MultiEntry>(item.tokens).length > 0 || safeArray<MultiEntry>(item.secretKeys).length > 0) && (
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span>التوكنات والمفاتيح السرية</span>
              </div>
              {safeArray<MultiEntry>(item.tokens).map((t, idx) => {
                const tId = safeString(t?.id) || `tok_${idx}`;
                const tLabel = safeString(t?.label) || 'Token';
                const tVal = safeString(t?.value);
                return (
                  <div key={tId} className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="font-bold text-cyan-300">{tLabel}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleRevealKey(tId)}
                          className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          {revealedKeys[tId] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopySensitive(tVal, tId)}
                          className="p-1 text-slate-400 hover:text-amber-400 cursor-pointer"
                        >
                          {copiedField === tId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="font-mono text-xs text-cyan-200 break-all select-all">
                      {revealedKeys[tId] ? tVal : '••••••••••••••••••••••••••••••••'}
                    </div>
                  </div>
                );
              })}

              {safeArray<MultiEntry>(item.secretKeys).map((s, idx) => {
                const sId = safeString(s?.id) || `sec_${idx}`;
                const sLabel = safeString(s?.label) || 'Secret Key';
                const sVal = safeString(s?.value);
                return (
                  <div key={sId} className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="font-bold text-rose-300">{sLabel}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleRevealKey(sId)}
                          className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          {revealedKeys[sId] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopySensitive(sVal, sId)}
                          className="p-1 text-slate-400 hover:text-amber-400 cursor-pointer"
                        >
                          {copiedField === sId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="font-mono text-xs text-rose-200 break-all select-all">
                      {revealedKeys[sId] ? sVal : '••••••••••••••••••••••••••••••••'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* License Keys & Certificates */}
          {(safeArray<MultiEntry>(item.licenseKeys).length > 0 || safeArray<MultiEntry>(item.certificates).length > 0) && (
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                <span>أرقام التراخيص والشهادات</span>
              </div>
              {safeArray<MultiEntry>(item.licenseKeys).map((l, idx) => {
                const lId = safeString(l?.id) || `lic_${idx}`;
                const lLabel = safeString(l?.label) || 'License';
                const lVal = safeString(l?.value);
                return (
                  <div key={lId} className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="font-bold text-emerald-300">{lLabel}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyNormal(lVal, lId)}
                        className="p-1 text-slate-400 hover:text-amber-400 cursor-pointer"
                      >
                        {copiedField === lId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="font-mono text-xs text-emerald-200 break-all select-all">
                      {lVal}
                    </div>
                  </div>
                );
              })}

              {safeArray<MultiEntry>(item.certificates).map((c, idx) => {
                const cId = safeString(c?.id) || `cert_${idx}`;
                const cLabel = safeString(c?.label) || 'Certificate';
                const cVal = safeString(c?.value);
                return (
                  <div key={cId} className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="font-bold text-teal-300">{cLabel}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyNormal(cVal, cId)}
                        className="p-1 text-slate-400 hover:text-amber-400 cursor-pointer"
                      >
                        {copiedField === cId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="font-mono text-xs text-teal-200 break-all select-all">
                      {cVal}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* General Notes */}
          {item.notes && (
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>ملاحظات عامة</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                {item.notes}
              </p>
            </div>
          )}

          {/* Secret Notes (Encrypted) */}
          {item.secretNotes && (
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-rose-900/40">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                  <Shield className="w-4 h-4 text-rose-400" />
                  <span>ملاحظات سرية مشفرة بـ AES-256</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSecretNotes(!showSecretNotes)}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  {showSecretNotes ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showSecretNotes ? 'إخفاء' : 'إظهار'}</span>
                </button>
              </div>
              <p className="text-xs text-rose-200 leading-relaxed whitespace-pre-wrap font-mono">
                {showSecretNotes ? item.secretNotes : '••••••••••••••••••••••••••••••••••••••••'}
              </p>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>تاريخ الإنشاء: {new Date(item.createdAt).toLocaleDateString('ar-EG')}</span>
            </div>
            {item.updatedAt && (
              <span>آخر تعديل: {new Date(item.updatedAt).toLocaleDateString('ar-EG')}</span>
            )}
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(item);
              }}
              className="vault-btn-3d px-3 py-1.5 rounded-xl text-xs font-bold text-amber-300 flex items-center gap-1.5 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>تعديل</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onDuplicate(item);
              }}
              className="vault-btn-3d px-3 py-1.5 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              <CopyPlus className="w-3.5 h-3.5 text-emerald-400" />
              <span>تكرار</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete(item.id);
              }}
              className="vault-btn-3d px-3 py-1.5 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف</span>
            </button>
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
