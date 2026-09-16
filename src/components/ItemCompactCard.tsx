import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Star,
  Copy,
  Check,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Maximize2,
  Key,
  Award,
  CopyPlus,
} from 'lucide-react';
import { VaultItem, Category } from '../types';
import { sounds } from '../utils/audio';
import { copySensitiveText, copyPlainText } from '../utils/clipboard';
import { sanitizeAndOpenUrl } from '../utils/url';
import { safeString } from '../utils/searchSafety';

interface ItemCompactCardProps {
  item: VaultItem;
  category?: Category;
  isExpanded: boolean;
  onToggleExpand: () => void;
  clipboardTimeout?: number;
  onView: (item: VaultItem) => void;
  onEdit: (item: VaultItem) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (item: VaultItem) => void;
  onToggleFavorite: (id: string) => void;
  onCopiedToast?: (msg: string) => void;
}

export const ItemCompactCard: React.FC<ItemCompactCardProps> = ({
  item,
  category,
  isExpanded,
  onToggleExpand,
  clipboardTimeout = 30,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  onCopiedToast,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const safeGlow = safeString(category?.glowColor);
  const glowStyle = safeGlow
    ? {
        boxShadow: `0 2px 14px ${safeGlow}`,
        borderColor: `${safeGlow.replace(/[\d\.]+\)$/, '0.25)')}`,
      }
    : {};

  const handleCopySensitive = async (text: string, fieldName: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
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

  const handleCopyNormal = async (text: string, fieldName: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!text) return;
    sounds.playKeypadClick();
    setCopiedField(fieldName);
    await copyPlainText(text);
    if (onCopiedToast) onCopiedToast('تم النسخ إلى الحافظة');
    setTimeout(() => {
      setCopiedField(null);
    }, 1800);
  };

  const handleOpenUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.url) return;
    sounds.playKeypadClick();
    sanitizeAndOpenUrl(item.url);
  };

  return (
    <div
      style={glowStyle}
      className="rounded-xl glass-panel p-3 border border-slate-800 transition-all duration-200 hover:border-slate-700"
    >
      {/* Compact Row */}
      <div
        onClick={onToggleExpand}
        className="flex items-center justify-between gap-3 cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Favorite Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(item.id);
            }}
            className="p-1 text-slate-400 hover:text-amber-400 cursor-pointer shrink-0"
          >
            <Star
              className={`w-4 h-4 ${
                item.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-500'
              }`}
            />
          </button>

          {/* Title */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                {item.title}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-amber-300 shrink-0">
                {category?.name || 'عام'}
              </span>
            </div>
            {item.url && (
              <div
                onClick={handleOpenUrl}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-mono truncate max-w-xs mt-0.5 flex items-center gap-1 cursor-pointer"
              >
                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate">{safeString(item.url).replace(/^https?:\/\//, '')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Expand / Collapse Action */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onView(item);
            }}
            title="عرض التفاصيل الكاملة"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <div className="p-1 rounded-lg text-slate-400 hover:text-slate-200">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Expanded Details Body */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 animate-in fade-in duration-150 text-right">
          {item.description && (
            <p className="text-xs text-slate-400">{item.description}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {item.username && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400">المستخدم:</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-slate-200 select-all">{item.username}</span>
                  <button
                    type="button"
                    onClick={(e) => handleCopyNormal(item.username, 'username', e)}
                    className="p-1 text-slate-400 hover:text-amber-400 cursor-pointer"
                  >
                    {copiedField === 'username' ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {item.password && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400">كلمة المرور:</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-slate-200">
                    {showPassword ? item.password : '••••••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleCopySensitive(item.password, 'password', e)}
                    className="p-1 text-slate-400 hover:text-amber-400 cursor-pointer"
                  >
                    {copiedField === 'password' ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
            <div className="flex items-center gap-2">
              {item.apiKeys && item.apiKeys.length > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-amber-400">
                  <Key className="w-3 h-3" />
                  {item.apiKeys.length} API
                </span>
              )}
              {item.licenseKeys && item.licenseKeys.length > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                  <Award className="w-3 h-3" />
                  {item.licenseKeys.length} ترخيص
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {onDuplicate && (
                <button
                  type="button"
                  onClick={() => onDuplicate(item)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                  title="تكرار كعنصر جديد"
                >
                  <CopyPlus className="w-3 h-3 text-emerald-400" />
                  <span>تكرار</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
              >
                <Edit2 className="w-3 h-3 text-amber-400" />
                <span>تعديل</span>
              </button>
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-950/70 border border-rose-900/60 text-rose-300 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>حذف</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
